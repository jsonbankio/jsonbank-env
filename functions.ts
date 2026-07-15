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
 * @param data
 */
export function jsonToEnv(data: ENV_OBJECT) {
  let env = "";

  for (const key in data) {
    const value = data[key];
    const type = typeof value;

    // wrap all string values with double quotes
    if (type === "string") {
      env += `${key}="${value}"${os.EOL}`;
    }
    // else if undefined or null then set value to empty string
    else if (value === undefined || value === null) {
      env += `${key}=${os.EOL}`;
    }
    // set value as it is except for type object
    else {
      // if object then skip
      if (type === "object") continue;

      // else set value as it is
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
 * @param env
 */
export function envToJson(
  env: string
): Record<string, string> | Array<Record<string, string>> {
  // loop through each line
  const lines = env.split(os.EOL);
  const endGroupKeys = [] as string[];

  for (const line in lines) {
    const lineStr = (lines[line] || "").trim();
    // if line begins with #, continue
    if (lineStr.startsWith("#")) continue;

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

  // parse env file
  const parsedEnv = dotenv.parse(env);
  let newEnv: Array<Record<string, string>> | Record<string, string>;
  if (endGroupKeys.length > 0) {
    newEnv = [];
    let group: Record<string, string> = {};
    for (const key in parsedEnv) {
      const value = parsedEnv[key];
      if (endGroupKeys.includes(key)) {
        group[key] = value;
        newEnv.push(group);
        group = {};
      } else {
        group[key] = value;
      }
    }

    // if last group is not empty
    if (Object.keys(group).length > 0) {
      newEnv.push(group);
    }
  } else {
    newEnv = parsedEnv;
  }

  return newEnv;
}
