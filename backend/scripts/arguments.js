function parseArguments(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 1) {
    const item = values[index];
    if (!item.startsWith("--")) continue;
    const [rawKey, inlineValue] = item.slice(2).split("=", 2);
    const next = inlineValue ?? values[index + 1];
    if (inlineValue === undefined && next && !next.startsWith("--")) index += 1;
    result[rawKey] = next && !next.startsWith("--") ? next : true;
  }
  return result;
}

function numeric(arguments_, key, fallback) {
  const value = arguments_[key] === undefined ? fallback : Number(arguments_[key]);
  if (!Number.isFinite(value)) throw new Error(`--${key} must be a number`);
  return value;
}

module.exports = { numeric, parseArguments };
