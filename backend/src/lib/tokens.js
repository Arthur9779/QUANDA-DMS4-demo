const crypto = require("node:crypto");

function randomToken(prefix) {
  return `${prefix}_${crypto.randomBytes(32).toString("base64url")}`;
}

function hashToken(token, secret) {
  return crypto.createHmac("sha256", secret).update(token, "utf8").digest();
}

function safeTokenEqual(first, second) {
  const firstHash = crypto.createHash("sha256").update(first, "utf8").digest();
  const secondHash = crypto.createHash("sha256").update(second, "utf8").digest();
  return crypto.timingSafeEqual(firstHash, secondHash);
}

module.exports = { randomToken, hashToken, safeTokenEqual };
