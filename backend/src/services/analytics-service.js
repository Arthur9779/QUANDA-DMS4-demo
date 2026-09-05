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

function wilsonInterval(successes, total, z = 1.96) {
  if (total <= 0) return null;
  const proportion = successes / total;
  const zSquared = z * z;
  const denominator = 1 + zSquared / total;
  const centre = proportion + zSquared / (2 * total);
  const margin = z * Math.sqrt(
    (proportion * (1 - proportion) + zSquared / (4 * total)) / total,
  );
  return {
    low: Number(Math.max(0, (centre - margin) / denominator).toFixed(4)),
    high: Number(Math.min(1, (centre + margin) / denominator).toFixed(4)),
  };
}

function retentionPoint(window, eligible, retained) {
  return {
    label: window.label,
    fromDay: window.fromDay,
    toDay: window.toDay,
    eligible,
    retained,
    rate: eligible > 0 ? ratio(retained, eligible) : null,
    interval95: wilsonInterval(retained, eligible),
  };
}

function createAnalyticsService({ pool }) {
  async function overview(filter) {
    const userScope = syntheticScope("u", filter);
    const sessionScope = syntheticScope("s", filter);
    const priorSessionScope = syntheticScope("previous", filter);
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
        WHERE s.last_seen_at >= ? AND s.last_seen_at < ? AND ${sessionScope.clause}`,
      [...windowParameters, ...sessionScope.parameters],
    );

    const [returningRows] = await pool.execute(
      `SELECT COUNT(DISTINCT s.user_id) AS returning_users
         FROM sessions s
        WHERE s.last_seen_at >= ? AND s.last_seen_at < ?
          AND ${sessionScope.clause}
          AND EXISTS (
            SELECT 1
              FROM sessions previous
             WHERE previous.user_id = s.user_id
               AND previous.started_at < s.started_at
               AND ${priorSessionScope.clause}
          )`,
      [
        filter.start,
        filter.end,
        ...sessionScope.parameters,
        ...priorSessionScope.parameters,
      ],
    );

    const clippedActivityStart = (days) =>
      new Date(Math.max(filter.start.getTime(), filter.end.getTime() - days * 86_400_000));
    const activityStart = clippedActivityStart(1);
    const weekStart = clippedActivityStart(7);
    const monthStart = clippedActivityStart(30);
    const [activeRows] = await pool.execute(
      `SELECT
         COUNT(DISTINCT CASE WHEN s.last_seen_at >= ? THEN s.user_id END) AS dau,
         COUNT(DISTINCT CASE WHEN s.last_seen_at >= ? THEN s.user_id END) AS wau,
         COUNT(DISTINCT CASE WHEN s.last_seen_at >= ? THEN s.user_id END) AS mau
       FROM sessions s
       WHERE s.last_seen_at < ? AND ${sessionScope.clause}`,
      [activityStart, weekStart, monthStart, filter.end, ...sessionScope.parameters],
    );

    const workflowExpression =
      "COALESCE(JSON_UNQUOTE(JSON_EXTRACT(e.properties_json, '$.workflow')), 'design')";
    const journeyExpression =
      `COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(e.properties_json, '$.workflowRunId')), ''), ` +
      `CONCAT('legacy:', ${workflowExpression}, ':', e.session_id))`;
    const [eventRows] = await pool.execute(
      `SELECT
         SUM(j.has_brief) AS briefs,
         SUM(j.has_brief AND j.has_plan_generated) AS plans_generated,
         SUM(j.has_brief AND j.has_usable_plan) AS usable_plans,
         SUM(j.has_brief AND j.has_plan_started) AS plan_starts,
         SUM(j.has_brief AND j.has_plan_failed) AS plan_failures,
         SUM(j.has_progress) AS projects_progressed,
         SUM(j.has_project_completed) AS projects_completed,
         SUM(j.work_items_completed) AS work_items_completed,
         SUM(j.workflow = 'design' AND j.has_brief) AS design_briefs,
         SUM(j.workflow = 'design' AND j.has_brief AND j.has_analysis) AS design_analyses,
         SUM(j.workflow = 'design' AND j.has_brief AND j.has_direction_confirmed) AS design_confirmations,
         SUM(j.workflow = 'design' AND j.has_brief AND j.has_tutorial_match) AS design_tutorial_matches,
         SUM(j.workflow = 'design' AND j.has_brief AND j.has_plan_started) AS design_plan_starts,
         SUM(j.workflow = 'design' AND j.has_brief AND j.has_plan_generated) AS design_roadmaps,
         SUM(j.workflow = 'design' AND j.has_brief AND j.has_usable_plan) AS design_usable_roadmaps,
         SUM(j.workflow = 'agentic_engineering' AND j.has_brief) AS engineering_briefs,
         SUM(j.workflow = 'agentic_engineering' AND j.has_brief AND j.has_interpretation) AS engineering_interpretations,
         SUM(j.workflow = 'agentic_engineering' AND j.has_brief AND j.has_guided_plan) AS engineering_guided_plans,
         SUM(j.workflow = 'agentic_engineering' AND j.has_brief AND j.has_agentic_plan) AS engineering_agentic_plans,
         SUM(j.workflow = 'agentic_engineering' AND j.has_brief AND j.has_plan_generated) AS engineering_plans,
         SUM(IF(j.workflow = 'agentic_engineering', j.work_items_completed, 0)) AS engineering_tasks_completed,
         SUM(j.workflow = 'design' AND j.has_usable_plan AND j.has_tutorial_opened) AS tutorial_projects,
         SUM(j.has_usable_plan AND j.has_calendar_use) AS calendar_projects
       FROM (
         SELECT
           ${journeyExpression} AS journey_id,
           ${workflowExpression} AS workflow,
           MAX(e.event_name = 'brief_submitted') AS has_brief,
           MAX(e.event_name = 'creative_dna_analysis_completed') AS has_analysis,
           MAX(e.event_name = 'creative_dna_confirmed') AS has_direction_confirmed,
           MAX(e.event_name = 'tutorial_matching_completed') AS has_tutorial_match,
           MAX(e.event_name IN ('roadmap_generate_started', 'engineering_plan_generate_started')) AS has_plan_started,
           MAX(e.event_name IN ('roadmap_generated', 'engineering_plan_generated')) AS has_plan_generated,
           MAX(e.event_name IN ('roadmap_viewed', 'engineering_plan_generated')) AS has_usable_plan,
           MAX(e.event_name IN ('roadmap_generate_failed', 'engineering_plan_generate_failed')) AS has_plan_failed,
           MAX(e.event_name = 'engineering_interpretation_completed') AS has_interpretation,
           MAX(
             e.event_name = 'engineering_plan_generated'
             AND JSON_UNQUOTE(JSON_EXTRACT(e.properties_json, '$.preparationMethod')) = 'guided_tutorials'
           ) AS has_guided_plan,
           MAX(
             e.event_name = 'engineering_plan_generated'
             AND JSON_UNQUOTE(JSON_EXTRACT(e.properties_json, '$.preparationMethod')) = 'agentic_project_plan'
           ) AS has_agentic_plan,
           MAX(e.event_name = 'tutorial_opened') AS has_tutorial_opened,
           MAX(e.event_name IN ('calendar_item_created', 'calendar_item_completed')) AS has_calendar_use,
           MAX(e.event_name IN ('tutorial_opened', 'roadmap_stage_completed', 'engineering_task_completed', 'calendar_item_completed')) AS has_progress,
           MAX(e.event_name = 'project_completed') AS has_project_completed,
           COUNT(DISTINCT CASE
             WHEN e.event_name IN ('roadmap_stage_completed', 'engineering_task_completed')
               OR (
                 e.event_name = 'calendar_item_completed'
                 AND COALESCE(JSON_UNQUOTE(JSON_EXTRACT(e.properties_json, '$.taskSource')), '') <> 'roadmap'
               )
             THEN CONCAT(
               ${workflowExpression},
               ':',
               COALESCE(
                 JSON_UNQUOTE(JSON_EXTRACT(e.properties_json, '$.stageId')),
                 JSON_UNQUOTE(JSON_EXTRACT(e.properties_json, '$.taskId')),
                 JSON_UNQUOTE(JSON_EXTRACT(e.properties_json, '$.calendarItemId')),
                 e.client_event_id
               )
             )
           END) AS work_items_completed
         FROM events e
         WHERE e.event_time >= ? AND e.event_time < ? AND ${eventScope.clause}
         GROUP BY journey_id, workflow
       ) j`,
      [...windowParameters, ...eventScope.parameters],
    );

    const users = userRows[0];
    const sessions = sessionRows[0];
    const active = activeRows[0];
    const events = eventRows[0];
    const plansGenerated = number(events.plans_generated);
    const usablePlans = number(events.usable_plans);
    const planStarts = number(events.plan_starts);
    return {
      window: { start: filter.start.toISOString(), endExclusive: filter.end.toISOString() },
      source: filter.source,
      scenarioId: filter.scenarioId || null,
      definitions: {
        identity: "Anonymous browser identity; clearing storage or using another browser creates a new identity.",
        active: "Distinct identities with session activity in the selected period.",
        returning: "Distinct active identities with an earlier session before another session active in the selected period.",
        rollingActivity: "Rolling activity is clipped to the selected period and ends at its exclusive end.",
        journey: "One distinct brief-to-result workflow. Repeated events inside the same journey are counted once.",
        projectProgress: "A journey with a tutorial opened or at least one roadmap, engineering, or calendar item completed.",
        projectCompletion: "A journey where every item in its generated plan was explicitly completed.",
      },
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
        roadmapsGenerated: number(events.design_roadmaps),
        usablePlans,
        briefToRoadmapConversion: ratio(
          number(events.design_usable_roadmaps),
          number(events.design_briefs),
        ),
        plansGenerated,
        briefToPlanConversion: ratio(usablePlans, number(events.briefs)),
        planGenerationStarted: planStarts,
        planGenerationFailures: number(events.plan_failures),
        planStartToCompletionRate: ratio(plansGenerated, planStarts),
        planGenerationGap: Math.max(planStarts - plansGenerated, 0),
        tutorialOpenRate: ratio(
          number(events.tutorial_projects),
          number(events.design_usable_roadmaps),
        ),
        calendarAdoption: ratio(number(events.calendar_projects), usablePlans),
        workItemsCompleted: number(events.work_items_completed),
        projectsProgressed: number(events.projects_progressed),
        projectsCompleted: number(events.projects_completed),
      },
      branches: {
        design: {
          briefsSubmitted: number(events.design_briefs),
          analysesCompleted: number(events.design_analyses),
          directionsConfirmed: number(events.design_confirmations),
          tutorialMatchesCompleted: number(events.design_tutorial_matches),
          planRequests: number(events.design_plan_starts),
          plansGenerated: number(events.design_roadmaps),
          usablePlans: number(events.design_usable_roadmaps),
          conversion: ratio(
            number(events.design_usable_roadmaps),
            number(events.design_briefs),
          ),
          generationReliability: ratio(
            number(events.design_roadmaps),
            number(events.design_plan_starts),
          ),
        },
        engineering: {
          briefsSubmitted: number(events.engineering_briefs),
          interpretationsCompleted: number(events.engineering_interpretations),
          guidedPlansGenerated: number(events.engineering_guided_plans),
          agenticPlansGenerated: number(events.engineering_agentic_plans),
          plansGenerated: number(events.engineering_plans),
          conversion: ratio(number(events.engineering_plans), number(events.engineering_briefs)),
          tasksCompleted: number(events.engineering_tasks_completed),
        },
      },
    };
  }

  async function retention(filter) {
    const userScope = syntheticScope("u", filter);
    const sessionScope = syntheticScope("s", filter);
    const startEventScope = syntheticScope("start_event", filter);
    const returnEventScope = syntheticScope("return_event", filter);
    const visitRetention = {};
    const valueRetention = {};
    const windows = [
      { key: "d1", label: "Day 1", fromDay: 1, toDay: 1 },
      { key: "d7", label: "Days 2–7", fromDay: 2, toDay: 7 },
      { key: "d30", label: "Days 8–30", fromDay: 8, toDay: 30 },
      { key: "any30", label: "Any return in days 1–30", fromDay: 1, toDay: 30 },
    ];
    for (const window of windows) {
      const [rows] = await pool.execute(
        `SELECT
           COUNT(*) AS eligible_users,
           SUM(EXISTS(
             SELECT 1 FROM sessions s
              WHERE s.user_id = u.id
                AND DATEDIFF(
                  DATE(CONVERT_TZ(s.started_at, '+00:00', '+07:00')),
                  DATE(CONVERT_TZ(u.created_at, '+00:00', '+07:00'))
                ) BETWEEN ? AND ?
                AND ${sessionScope.clause}
           )) AS retained_users
         FROM users u
         WHERE u.created_at >= ?
           AND u.created_at < DATE_SUB(?, INTERVAL ? DAY)
           AND u.deleted_at IS NULL
           AND ${userScope.clause}`,
        [
          window.fromDay,
          window.toDay,
          ...sessionScope.parameters,
          filter.start,
          filter.end,
          window.toDay,
          ...userScope.parameters,
        ],
      );
      const eligible = number(rows[0].eligible_users);
      const retained = number(rows[0].retained_users);
      visitRetention[window.key] = retentionPoint(window, eligible, retained);

      const [valueRows] = await pool.execute(
        `SELECT
           COUNT(*) AS eligible_users,
           SUM(EXISTS(
             SELECT 1 FROM events return_event
              WHERE return_event.user_id = cohort.user_id
                AND return_event.event_time > cohort.first_value_at
                AND return_event.event_name IN (
                  'roadmap_viewed',
                  'engineering_plan_generated',
                  'tutorial_opened',
                  'roadmap_stage_completed',
                  'engineering_task_completed',
                  'calendar_item_completed'
                )
                AND DATEDIFF(
                  DATE(CONVERT_TZ(return_event.event_time, '+00:00', '+07:00')),
                  DATE(CONVERT_TZ(cohort.first_value_at, '+00:00', '+07:00'))
                ) BETWEEN ? AND ?
                AND ${returnEventScope.clause}
           )) AS retained_users
         FROM (
           SELECT start_event.user_id, MIN(start_event.event_time) AS first_value_at
             FROM events start_event
            WHERE start_event.event_name IN ('roadmap_viewed', 'engineering_plan_generated')
              AND ${startEventScope.clause}
            GROUP BY start_event.user_id
         ) cohort
        WHERE cohort.first_value_at >= ?
          AND cohort.first_value_at < DATE_SUB(?, INTERVAL ? DAY)`,
        [
          window.fromDay,
          window.toDay,
          ...returnEventScope.parameters,
          ...startEventScope.parameters,
          filter.start,
          filter.end,
          window.toDay,
        ],
      );
      const valueEligible = number(valueRows[0].eligible_users);
      const valueRetained = number(valueRows[0].retained_users);
      valueRetention[window.key] = retentionPoint(window, valueEligible, valueRetained);
    }
    return {
      window: { start: filter.start.toISOString(), endExclusive: filter.end.toISOString() },
      source: filter.source,
      scenarioId: filter.scenarioId || null,
      definition: "Vietnam-local first-event cohorts; immature cohorts and same-day activity are excluded.",
      timeZone: "Asia/Ho_Chi_Minh",
      methodology: {
        visitStart: "The identity's first recorded visit.",
        visitReturn: "A new session on a later Vietnam-local calendar day.",
        valueStart: "The identity's first usable design roadmap view or generated engineering plan.",
        valueReturn: "A later-day plan view, tutorial open, plan generation, task completion, or calendar completion.",
        identityLimit: "Anonymous browser identities cannot be joined across cleared storage, browsers, or devices.",
        interval: "Rates include a 95% Wilson interval so small samples are visibly uncertain.",
      },
      summary: {
        visitReturn30Day: visitRetention.any30,
        valueReturn30Day: valueRetention.any30,
      },
      visitRetention,
      valueRetention,
      retention: visitRetention,
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

module.exports = { createAnalyticsService, syntheticScope, wilsonInterval };
