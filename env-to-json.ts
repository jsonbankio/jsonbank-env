#!/usr/bin/env node

import { logThis } from "./functions";
import fs from "fs";
import path from "path";
import os from "os";
import dotenv from "dotenv";

let envFile = process.argv[2] || ".env";
let jsonFile = process.argv[3];

// get current working directory
const cwd = process.cwd();

// check if env file exists
if (!fs.existsSync(envFile)) {
  logThis(`Env file {${envFile}} does not exist..`, 1);
}

envFile = path.join(cwd, envFile);

// read env file
const env = fs.readFileSync(envFile, "utf-8");

// loop through each line
const lines = env.split(os.EOL);
const endGroupKeys = [] as string[];

for (const line in lines) {
  const lineStr = (lines[line] || "").trim();
  // if line begins with #, continue
  if (lineStr.startsWith("#")) continue;

  // if line is empty and not last line, then get the previous line env key
  if (lineStr === "" && Number(line) !== lines.length - 1) {
    const prevLine = lines[Number(line) - 1];
    const prevLineKey = prevLine.split("=")[0];
    endGroupKeys.push(prevLineKey);
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

// if json file exists then write to it
// else write to console
if (jsonFile) {
  jsonFile = path.join(cwd, jsonFile);
  fs.writeFileSync(jsonFile, JSON.stringify(newEnv, null, 2));

  logThis(`Env file {${envFile}}${os.EOL}Converted to {${jsonFile}}`);
} else {
  logThis(JSON.stringify(newEnv, null, 2));
}
