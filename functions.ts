import os from "os";
import dotenv from "dotenv";

export type ENV_OBJECT = Record<string, string | number | boolean | null>;
export type ENV_OBJECT_ARRAY = (ENV_OBJECT | string)[];

// A simple logger function.
export function logThis(message: string, exit?: number) {
  console.log(message);
  if (exit !== undefined) {
    console.log(); // new line
    process.exit(exit);
  }
}

/**
 * Converts json to env format
 * Keys prefixed with "!" are written with single quoted values.
 * e.g. {"!SECRET": "a $ecret"} => SECRET='a $ecret'
 * @param data
 */
export function jsonToEnv(data: ENV_OBJECT) {
  let env = "";

  for (let key in data) {
    const value = data[key];
    const type = typeof value;

    // "!" prefixed keys are single quoted
    const singleQuoted = key.startsWith("!");
    // remove "!" from key
    if (singleQuoted) key = key.slice(1);

    // if undefined or null then set value to empty string
    if (value === undefined || value === null) {
      env += `${key}=${os.EOL}`;
    }
    // if object then skip
    else if (type === "object") {
      continue;
    }
    // if single quoted then wrap value with single quotes
    else if (singleQuoted) {
      env += `${key}='${value}'${os.EOL}`;
    }
    // wrap all string values with double quotes
    else if (type === "string") {
      env += `${key}="${value}"${os.EOL}`;
    }
    // else set value as it is
    else {
      env += `${key}=${value}${os.EOL}`;
    }
  }

  return env;
}

/**
 * Converts json array to env format
 * @param data
 */
export function jsonArrayToEnv(data: ENV_OBJECT_ARRAY) {
  let env = "";

  for (const item of data) {
    // if string then it is a comment
    // else if object then convert to env
    if (typeof item === "string") {
      env += `# ${item}${os.EOL}`;
    } else if (typeof item === "object") {
      env += jsonToEnv(item);
      // add new line between each object
      env += os.EOL;
    }
  }

  return env;
}

/**
 * Converts env file content to json.
 * Blank lines are treated as group separators and
 * comment lines are kept as strings.
 * If the env has no comments and only one group,
 * a single object is returned, else an array is returned.
 * Single quoted values are exported with a "!" prefixed key.
 * e.g. SECRET='a $ecret' => {"!SECRET": "a $ecret"}
 * @param env
 */
export function envToJson(
  env: string
): Record<string, string> | Array<Record<string, string> | string> {
  // parse env file for values
  const parsedEnv = dotenv.parse(env);

  const items: Array<Record<string, string> | string> = [];
  let group: Record<string, string> = {};

  // push current group to items if not empty
  const endGroup = () => {
    if (Object.keys(group).length > 0) {
      items.push(group);
      group = {};
    }
  };

  for (const line of env.split(os.EOL)) {
    const lineStr = line.trim();

    // blank lines end the current group
    if (lineStr === "") {
      endGroup();
      continue;
    }

    // comment lines end the current group and are kept as strings
    if (lineStr.startsWith("#")) {
      endGroup();
      items.push(lineStr.replace(/^#\s?/, ""));
      continue;
    }

    // env lines e.g KEY=value or export KEY=value
    const match = lineStr.match(/^(?:export\s+)?([^=\s]+)\s*=(.*)$/);
    if (!match) continue;

    const key = match[1];
    if (!Object.prototype.hasOwnProperty.call(parsedEnv, key)) continue;

    // single quoted values are exported with a "!" prefixed key
    const singleQuoted = /^\s*'.*'\s*$/.test(match[2]);
    group[singleQuoted ? `!${key}` : key] = parsedEnv[key];
  }

  endGroup();

  // if only one object and no comments, return it as a single object
  if (items.length === 1 && typeof items[0] === "object") {
    return items[0];
  }

  // if env is empty, return an empty object
  if (items.length === 0) return {};

  return items;
}
