/** Reads server/.env into process.env without pulling in dotenv. Values
 *  already in the environment always win, so a real deployment can set them
 *  properly and ignore the file. */
import { readFileSync, existsSync } from "node:fs";

export function loadEnv(file = new URL("./.env", import.meta.url).pathname) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
