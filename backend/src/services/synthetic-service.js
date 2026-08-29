const crypto = require("node:crypto");
const { withTransaction } = require("../db/pool");
const { notFound } = require("../lib/errors");

function seededRandom(seed) {
  let state = crypto.createHash("sha256").update(String(seed)).digest().readUInt32LE(0);
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function chance(random, probability) {
  return random() < probability;
}

function randomDate(random, start, end) {
  return new Date(start.getTime() + random() * (end.getTime() - start.getTime()));
}

function plusDays(date, days, random) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  result.setUTCHours(Math.floor(random() * 20), Math.floor(random() * 60), 0, 0);
  return result;
}

function boundedRate(value) {
  return Math.max(0, Math.min(1, value));
}

function createSyntheticService({ pool }) {
  async function generate(input) {
    const scenarioId = crypto.randomUUID();
    const random = seededRandom(input.seed);
    const summary = {
      scenarioId,
      users: input.users,
      sessions: 0,
      projects: 0,
      events: 0,
    };

    await withTransaction(pool, async (connection) => {
      await connection.execute(
        `INSERT INTO synthetic_scenarios
           (id, name, configuration_json, random_seed, created_at)
         VALUES (?, ?, ?, ?, UTC_TIMESTAMP(3))`,
        [scenarioId, input.name, JSON.stringify(input), String(input.seed)],
      );

      for (let index = 0; index < input.users; index += 1) {
        const userId = crypto.randomUUID();
        const createdAt = randomDate(random, input.start, input.end);
        const sessions = [createdAt];
        if (chance(random, input.d1Retention)) sessions.push(plusDays(createdAt, 1, random));
        if (chance(random, input.d7Retention)) sessions.push(plusDays(createdAt, 7, random));
        if (chance(random, input.d30Retention)) sessions.push(plusDays(createdAt, 30, random));
        const extraSessions = Math.max(
          0,
          Math.round(input.sessionsPerUser - sessions.length + (random() - 0.5) * 2),
        );
        for (let extra = 0; extra < extraSessions; extra += 1) {
          sessions.push(randomDate(random, createdAt, new Date(input.end.getTime() + 30 * 86_400_000)));
        }
        sessions.sort((left, right) => left - right);
        const lastSeenAt = sessions.at(-1);
        await connection.execute(
          `INSERT INTO users
             (id, account_type, created_at, last_seen_at, is_synthetic, scenario_id)
           VALUES (?, 'anonymous', ?, ?, TRUE, ?)`,
          [userId, createdAt, lastSeenAt, scenarioId],
        );

        const sessionRecords = [];
        for (const startedAt of sessions) {
          const sessionId = crypto.randomUUID();
          const seenAt = new Date(startedAt.getTime() + Math.floor(random() * 25) * 60_000);
          await connection.execute(
            `INSERT INTO sessions
               (id, user_id, token_hash, started_at, last_seen_at, ended_at,
                is_synthetic, scenario_id)
             VALUES (?, ?, ?, ?, ?, ?, TRUE, ?)`,
            [
              sessionId,
              userId,
              crypto.randomBytes(32),
              startedAt,
              seenAt,
              seenAt,
              scenarioId,
            ],
          );
          sessionRecords.push({ id: sessionId, time: startedAt });
          summary.sessions += 1;
          await insertSyntheticEvent(connection, {
            scenarioId,
            userId,
            sessionId,
            eventName: "site_opened",
            eventTime: startedAt,
          });
          summary.events += 1;
        }

        const firstSession = sessionRecords[0];
        const projectId = crypto.randomUUID();
        const submittedBrief = chance(random, 0.88);
        const generatedRoadmap = submittedBrief && chance(random, 0.76);
        const completedProject = generatedRoadmap && chance(random, input.roadmapCompletion);
        const status = completedProject ? "completed" : generatedRoadmap ? "active" : "draft";
        await connection.execute(
          `INSERT INTO projects
             (id, user_id, client_project_id, schema_version, title, status,
              project_data, version, created_at, updated_at, completed_at,
              is_synthetic, scenario_id)
           VALUES (?, ?, ?, 1, ?, ?, ?, 1, ?, ?, ?, TRUE, ?)`,
          [
            projectId,
            userId,
            crypto.randomUUID(),
            `Synthetic QUANDA project ${index + 1}`,
            status,
            JSON.stringify({ synthetic: true, roadmapStageCount: 6 }),
            createdAt,
            lastSeenAt,
            completedProject ? lastSeenAt : null,
            scenarioId,
          ],
        );
        summary.projects += 1;

        if (submittedBrief) {
          await insertSyntheticEvent(connection, {
            scenarioId,
            userId,
            sessionId: firstSession.id,
            projectId,
            eventName: "brief_submitted",
            eventTime: firstSession.time,
          });
          summary.events += 1;
        }
        if (generatedRoadmap) {
          for (const name of ["roadmap_generated", "roadmap_viewed"]) {
            await insertSyntheticEvent(connection, {
              scenarioId,
              userId,
              sessionId: firstSession.id,
              projectId,
              eventName: name,
              eventTime: firstSession.time,
              properties: name === "roadmap_generated" ? { source: "synthetic" } : {},
            });
            summary.events += 1;
          }
        }
        if (generatedRoadmap && chance(random, input.tutorialEngagement)) {
          await insertSyntheticEvent(connection, {
            scenarioId,
            userId,
            sessionId: firstSession.id,
            projectId,
            eventName: "tutorial_opened",
            eventTime: firstSession.time,
            properties: { tutorialId: `synthetic-tutorial-${1 + Math.floor(random() * 8)}` },
          });
          summary.events += 1;
        }
        if (generatedRoadmap && chance(random, input.calendarAdoption)) {
          await insertSyntheticEvent(connection, {
            scenarioId,
            userId,
            sessionId: firstSession.id,
            projectId,
            eventName: "calendar_item_created",
            eventTime: firstSession.time,
          });
          summary.events += 1;
        }
        if (generatedRoadmap) {
          const completedStages = completedProject ? 6 : Math.floor(random() * 6);
          for (let stage = 1; stage <= completedStages; stage += 1) {
            await insertSyntheticEvent(connection, {
              scenarioId,
              userId,
              sessionId: sessionRecords.at(-1).id,
              projectId,
              eventName: "roadmap_stage_completed",
              eventTime: lastSeenAt,
              properties: { stageId: `stage-${stage}` },
            });
            summary.events += 1;
          }
        }
        if (completedProject) {
          await insertSyntheticEvent(connection, {
            scenarioId,
            userId,
            sessionId: sessionRecords.at(-1).id,
            projectId,
            eventName: "project_completed",
            eventTime: lastSeenAt,
          });
          summary.events += 1;
        }
      }
    });
    return summary;
  }

  async function remove(scenarioId) {
    return withTransaction(pool, async (connection) => {
      const [scenarios] = await connection.execute(
        "SELECT id FROM synthetic_scenarios WHERE id = ? LIMIT 1 FOR UPDATE",
        [scenarioId],
      );
      if (!scenarios[0]) throw notFound("scenario_not_found", "The synthetic scenario was not found.");
      const counts = {};
      for (const table of ["events", "projects", "sessions", "users"]) {
        const [result] = await connection.execute(
          `DELETE FROM ${table} WHERE scenario_id = ? AND is_synthetic = TRUE`,
          [scenarioId],
        );
        counts[table] = result.affectedRows;
      }
      await connection.execute("DELETE FROM synthetic_scenarios WHERE id = ?", [scenarioId]);
      return { scenarioId, deleted: counts };
    });
  }

  return { generate, remove };
}

async function insertSyntheticEvent(connection, input) {
  await connection.execute(
    `INSERT INTO events
       (id, client_event_id, user_id, session_id, project_id, event_name,
        event_time, properties_json, created_at, is_synthetic, scenario_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3), TRUE, ?)`,
    [
      crypto.randomUUID(),
      crypto.randomUUID(),
      input.userId,
      input.sessionId,
      input.projectId || null,
      input.eventName,
      input.eventTime,
      JSON.stringify(input.properties || {}),
      input.scenarioId,
    ],
  );
}

module.exports = { boundedRate, createSyntheticService, seededRandom };
