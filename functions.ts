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
 * Blank lines are treated as group separators:
 * if any group separator is found, an array of objects is returned,
 * else a single object is returned.
 * Single quoted values are exported with a "!" prefixed key.
 * e.g. SECRET='a $ecret' => {"!SECRET": "a $ecret"}
 * @param env
 */
export function envToJson(
  env: string
): Record<string, string> | Array<Record<string, string>> {
  // loop through each line
  const lines = env.split(os.EOL);
  const endGroupKeys = [] as string[];
  const singleQuotedKeys = new Set<string>();

  for (const line in lines) {
    const lineStr = (lines[line] || "").trim();
    // if line begins with #, continue
    if (lineStr.startsWith("#")) continue;

    // if value is single quoted, keep track of the key
    const singleQuoted = lineStr.match(/^(?:export\s+)?([^=\s]+)\s*=\s*'.*'$/);
    if (singleQuoted) singleQuotedKeys.add(singleQuoted[1]);

    // if line is empty and not last line, then get the previous line env key
    if (lineStr === "" && Number(line) !== lines.length - 1) {
      const prevLine = lines[Number(line) - 1] || "";
      const prevLineKey = prevLine.split("=")[0];
      // a blank or comment previous line has no key to end a group with
      if (prevLineKey && !prevLineKey.trim().startsWith("#")) {
        endGroupKeys.push(prevLineKey);
      }
    }
  }

  // prefix single quoted keys with "!"
  const jsonKey = (key: string) =>
    singleQuotedKeys.has(key) ? `!${key}` : key;

  // parse env file
  const parsedEnv = dotenv.parse(env);
  let newEnv: Array<Record<string, string>> | Record<string, string>;
  if (endGroupKeys.length > 0) {
    newEnv = [];
    let group: Record<string, string> = {};
    for (const key in parsedEnv) {
      const value = parsedEnv[key];
      if (endGroupKeys.includes(key)) {
        group[jsonKey(key)] = value;
        newEnv.push(group);
        group = {};
      } else {
        group[jsonKey(key)] = value;
      }
    }

    // if last group is not empty
    if (Object.keys(group).length > 0) {
      newEnv.push(group);
    }
  } else {
    newEnv = {};
    for (const key in parsedEnv) {
      newEnv[jsonKey(key)] = parsedEnv[key];
    }
  }

  return newEnv;
}
