const { withTransaction } = require("../db/pool");
const { forbidden } = require("../lib/errors");
const { canonicalEventName } = require("../validation/events");

const MAX_CLOCK_SKEW_MS = 7 * 24 * 60 * 60 * 1_000;

function normalizedEventTime(value) {
  const time = new Date(value);
  if (Math.abs(Date.now() - time.getTime()) > MAX_CLOCK_SKEW_MS) {
    return new Date();
  }
  return time;
}

function createEventService({ pool }) {
  async function recordBatch(auth, events) {
    return withTransaction(pool, async (connection) => {
      const projectIds = [...new Set(events.flatMap((event) => event.projectId || []))];
      if (projectIds.length > 0) {
        const placeholders = projectIds.map(() => "?").join(", ");
        const [projects] = await connection.execute(
          `SELECT id FROM projects
            WHERE user_id = ? AND deleted_at IS NULL AND id IN (${placeholders})`,
          [auth.userId, ...projectIds],
        );
        if (projects.length !== projectIds.length) {
          throw forbidden("project_forbidden", "An event references an unavailable project.");
        }
      }

      let accepted = 0;
      let duplicate = 0;
      for (const event of events) {
        const name = canonicalEventName(event.name);
        const properties = { ...event.properties };
        if (name !== event.name) properties.originalEventName = event.name;
        const [result] = await connection.execute(
          `INSERT IGNORE INTO events
             (id, client_event_id, user_id, session_id, project_id, event_name,
              event_time, properties_json, created_at, is_synthetic)
           VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3), FALSE)`,
          [
            event.id,
            auth.userId,
            auth.sessionId,
            event.projectId || null,
            name,
            normalizedEventTime(event.eventTime),
            JSON.stringify(properties),
          ],
        );
        if (result.affectedRows === 1) accepted += 1;
        else duplicate += 1;
      }
      return { accepted, duplicate };
    });
  }

  return { recordBatch };
}

module.exports = { createEventService };
