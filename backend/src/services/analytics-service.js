function syntheticScope(alias, filter) {
  if (filter.source === "real") {
    return { clause: `${alias}.is_synthetic = FALSE`, parameters: [] };
  }
  if (filter.scenarioId) {
    return {
      clause: `${alias}.is_synthetic = TRUE AND ${alias}.scenario_id = ?`,
      parameters: [filter.scenarioId],
    };
  }
  return { clause: `${alias}.is_synthetic = TRUE`, parameters: [] };
}

function number(value) {
  return Number(value || 0);
}

function ratio(numerator, denominator) {
  return denominator > 0 ? Number((numerator / denominator).toFixed(4)) : 0;
}

function createAnalyticsService({ pool }) {
  async function overview(filter) {
    const userScope = syntheticScope("u", filter);
    const sessionScope = syntheticScope("s", filter);
    const eventScope = syntheticScope("e", filter);
    const windowParameters = [filter.start, filter.end];

    const [userRows] = await pool.execute(
      `SELECT
         COUNT(*) AS total_users,
         SUM(CASE WHEN u.created_at >= ? AND u.created_at < ? THEN 1 ELSE 0 END) AS new_users
       FROM users u
       WHERE ${userScope.clause} AND u.deleted_at IS NULL AND u.created_at < ?`,
      [filter.start, filter.end, ...userScope.parameters, filter.end],
    );

    const [sessionRows] = await pool.execute(
      `SELECT COUNT(*) AS total_sessions, COUNT(DISTINCT s.user_id) AS active_users
         FROM sessions s
        WHERE s.started_at >= ? AND s.started_at < ? AND ${sessionScope.clause}`,
      [...windowParameters, ...sessionScope.parameters],
    );

    const [returningRows] = await pool.execute(
      `SELECT COUNT(DISTINCT s.user_id) AS returning_users
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.started_at >= ? AND s.started_at < ?
          AND u.created_at < ? AND ${sessionScope.clause}`,
      [filter.start, filter.end, filter.start, ...sessionScope.parameters],
    );

    const activityStart = new Date(filter.end.getTime() - 86_400_000);
    const weekStart = new Date(filter.end.getTime() - 7 * 86_400_000);
    const monthStart = new Date(filter.end.getTime() - 30 * 86_400_000);
    const [activeRows] = await pool.execute(
      `SELECT
         COUNT(DISTINCT CASE WHEN s.last_seen_at >= ? THEN s.user_id END) AS dau,
         COUNT(DISTINCT CASE WHEN s.last_seen_at >= ? THEN s.user_id END) AS wau,
         COUNT(DISTINCT CASE WHEN s.last_seen_at >= ? THEN s.user_id END) AS mau
       FROM sessions s
       WHERE s.last_seen_at < ? AND ${sessionScope.clause}`,
      [activityStart, weekStart, monthStart, filter.end, ...sessionScope.parameters],
    );

    const [eventRows] = await pool.execute(
      `SELECT
         SUM(e.event_name = 'brief_submitted') AS briefs,
         SUM(e.event_name = 'roadmap_generated') AS roadmaps,
         COUNT(DISTINCT CASE WHEN e.event_name = 'roadmap_viewed' THEN e.project_id END) AS viewed_projects,
         COUNT(DISTINCT CASE WHEN e.event_name = 'tutorial_opened' THEN e.project_id END) AS tutorial_projects,
         COUNT(DISTINCT CASE WHEN e.event_name = 'roadmap_generated' THEN e.user_id END) AS roadmap_users,
         COUNT(DISTINCT CASE WHEN e.event_name IN ('calendar_item_created', 'calendar_item_completed') THEN e.user_id END) AS calendar_users,
         COUNT(DISTINCT CASE WHEN e.event_name = 'roadmap_stage_completed' THEN CONCAT(e.project_id, ':', JSON_UNQUOTE(JSON_EXTRACT(e.properties_json, '$.stageId'))) END) AS stages_completed,
         COUNT(DISTINCT CASE WHEN e.event_name = 'project_completed' THEN e.project_id END) AS projects_completed
       FROM events e
       WHERE e.event_time >= ? AND e.event_time < ? AND ${eventScope.clause}`,
      [...windowParameters, ...eventScope.parameters],
    );

    const users = userRows[0];
    const sessions = sessionRows[0];
    const active = activeRows[0];
    const events = eventRows[0];
    return {
      window: { start: filter.start.toISOString(), endExclusive: filter.end.toISOString() },
      source: filter.source,
      scenarioId: filter.scenarioId || null,
      users: {
        total: number(users.total_users),
        new: number(users.new_users),
        returning: number(returningRows[0].returning_users),
        active: number(sessions.active_users),
      },
      sessions: {
        total: number(sessions.total_sessions),
        averagePerActiveUser: ratio(number(sessions.total_sessions), number(sessions.active_users)),
      },
      activity: { dau: number(active.dau), wau: number(active.wau), mau: number(active.mau) },
      product: {
        briefsSubmitted: number(events.briefs),
        roadmapsGenerated: number(events.roadmaps),
        briefToRoadmapConversion: ratio(number(events.roadmaps), number(events.briefs)),
        tutorialOpenRate: ratio(number(events.tutorial_projects), number(events.viewed_projects)),
        calendarAdoption: ratio(number(events.calendar_users), number(events.roadmap_users)),
        stagesCompleted: number(events.stages_completed),
        projectsCompleted: number(events.projects_completed),
      },
    };
  }

  async function retention(filter) {
    const userScope = syntheticScope("u", filter);
    const sessionScope = syntheticScope("s", filter);
    const results = {};
    for (const day of [1, 7, 30]) {
      const [rows] = await pool.execute(
        `SELECT
           COUNT(*) AS eligible_users,
           SUM(EXISTS(
             SELECT 1 FROM sessions s
              WHERE s.user_id = u.id
                AND DATEDIFF(DATE(s.started_at), DATE(u.created_at)) = ?
                AND ${sessionScope.clause}
           )) AS retained_users
         FROM users u
         WHERE u.created_at >= ?
           AND u.created_at < DATE_SUB(?, INTERVAL ? DAY)
           AND u.deleted_at IS NULL
           AND ${userScope.clause}`,
        [
          day,
          ...sessionScope.parameters,
          filter.start,
          filter.end,
          day,
          ...userScope.parameters,
        ],
      );
      const eligible = number(rows[0].eligible_users);
      const retained = number(rows[0].retained_users);
      results[`d${day}`] = { eligible, retained, rate: ratio(retained, eligible) };
    }
    return {
      window: { start: filter.start.toISOString(), endExclusive: filter.end.toISOString() },
      source: filter.source,
      scenarioId: filter.scenarioId || null,
      definition: "Exact UTC calendar-day return; immature cohorts are excluded.",
      retention: results,
    };
  }

  async function eventCounts(filter) {
    const eventScope = syntheticScope("e", filter);
    const [rows] = await pool.execute(
      `SELECT e.event_name AS name, COUNT(*) AS count,
              COUNT(DISTINCT e.user_id) AS unique_users
         FROM events e
        WHERE e.event_time >= ? AND e.event_time < ? AND ${eventScope.clause}
        GROUP BY e.event_name
        ORDER BY count DESC, name ASC`,
      [filter.start, filter.end, ...eventScope.parameters],
    );
    return {
      window: { start: filter.start.toISOString(), endExclusive: filter.end.toISOString() },
      source: filter.source,
      scenarioId: filter.scenarioId || null,
      events: rows.map((row) => ({
        name: row.name,
        count: number(row.count),
        uniqueUsers: number(row.unique_users),
      })),
    };
  }

  return { eventCounts, overview, retention };
}

module.exports = { createAnalyticsService, syntheticScope };
