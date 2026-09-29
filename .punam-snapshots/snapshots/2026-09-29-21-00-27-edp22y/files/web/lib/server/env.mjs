/** Reads server/.env into process.env without pulling in dotenv. Values
 *  already in the environment always win, so a real deployment can set them
 *  properly and ignore the file. */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* `new URL("./x", import.meta.url).pathname` looks tidy and has two faults:
   a bundler reads it as a static asset reference and fails the build when
   the file is not there yet, and on Windows it yields "/C:/..." with a
   leading slash that no filesystem call accepts. Resolve the directory
   once, properly, instead. */
const HERE = dirname(fileURLToPath(import.meta.url));


export function loadEnv(file = join(HERE, ".env")) {
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
