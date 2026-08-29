const crypto = require("node:crypto");
const { conflict, notFound } = require("../lib/errors");

function parseProjectData(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function projectRecord(row, includeData = true) {
  return {
    id: row.id,
    clientProjectId: row.client_project_id,
    schemaVersion: row.schema_version,
    title: row.title,
    status: row.status,
    inputFingerprint: row.input_fingerprint,
    version: row.version,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    ...(includeData ? { data: parseProjectData(row.project_data) } : {}),
  };
}

function createProjectService({ pool }) {
  async function create(userId, input) {
    const id = crypto.randomUUID();
    try {
      await pool.execute(
        `INSERT INTO projects
           (id, user_id, client_project_id, schema_version, title, status,
            input_fingerprint, project_data, version, created_at, updated_at,
            completed_at, is_synthetic)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3),
                 CASE WHEN ? = 'completed' THEN UTC_TIMESTAMP(3) ELSE NULL END,
                 FALSE)`,
        [
          id,
          userId,
          input.clientProjectId,
          input.schemaVersion,
          input.title,
          input.status,
          input.inputFingerprint || null,
          JSON.stringify(input.data),
          input.status,
        ],
      );
    } catch (error) {
      if (error?.code !== "ER_DUP_ENTRY") throw error;
      const [existing] = await pool.execute(
        `SELECT * FROM projects
          WHERE user_id = ? AND client_project_id = ? AND deleted_at IS NULL
          LIMIT 1`,
        [userId, input.clientProjectId],
      );
      if (existing[0]) return { project: projectRecord(existing[0]), created: false };
      throw conflict("project_conflict", "The project identifier is already in use.");
    }
    return { project: await get(userId, id), created: true };
  }

  async function list(userId, { limit, status }) {
    const parameters = [userId];
    const statusClause = status ? " AND status = ?" : "";
    if (status) parameters.push(status);
    parameters.push(limit);
    const [rows] = await pool.execute(
      `SELECT id, client_project_id, schema_version, title, status,
              input_fingerprint, version, created_at, updated_at, completed_at
         FROM projects
        WHERE user_id = ? AND deleted_at IS NULL${statusClause}
        ORDER BY updated_at DESC, id DESC
        LIMIT ?`,
      parameters,
    );
    return rows.map((row) => projectRecord(row, false));
  }

  async function get(userId, id) {
    const [rows] = await pool.execute(
      "SELECT * FROM projects WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1",
      [id, userId],
    );
    if (!rows[0]) throw notFound("project_not_found", "The project was not found.");
    return projectRecord(rows[0]);
  }

  async function update(userId, id, input) {
    const assignments = [];
    const parameters = [];
    const fields = {
      schemaVersion: "schema_version",
      title: "title",
      status: "status",
      inputFingerprint: "input_fingerprint",
    };
    for (const [key, column] of Object.entries(fields)) {
      if (input[key] !== undefined) {
        assignments.push(`${column} = ?`);
        parameters.push(input[key]);
      }
    }
    if (input.data !== undefined) {
      assignments.push("project_data = ?");
      parameters.push(JSON.stringify(input.data));
    }
    if (input.status === "completed") {
      assignments.push("completed_at = COALESCE(completed_at, UTC_TIMESTAMP(3))");
    } else if (input.status !== undefined) {
      assignments.push("completed_at = NULL");
    }
    assignments.push("version = version + 1", "updated_at = UTC_TIMESTAMP(3)");
    parameters.push(id, userId, input.expectedVersion);
    const [result] = await pool.execute(
      `UPDATE projects SET ${assignments.join(", ")}
        WHERE id = ? AND user_id = ? AND version = ? AND deleted_at IS NULL`,
      parameters,
    );
    if (result.affectedRows !== 1) {
      const [rows] = await pool.execute(
        "SELECT version FROM projects WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1",
        [id, userId],
      );
      if (!rows[0]) throw notFound("project_not_found", "The project was not found.");
      throw conflict(
        "project_version_conflict",
        "The project changed elsewhere. Reload it before saving again.",
      );
    }
    return get(userId, id);
  }

  async function remove(userId, id) {
    const [result] = await pool.execute(
      `UPDATE projects
          SET status = 'archived', deleted_at = UTC_TIMESTAMP(3),
              updated_at = UTC_TIMESTAMP(3), version = version + 1
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [id, userId],
    );
    if (result.affectedRows !== 1) {
      throw notFound("project_not_found", "The project was not found.");
    }
  }

  return { create, get, list, remove, update };
}

module.exports = { createProjectService, projectRecord };
