#!/usr/bin/env node

import { envToJson, logThis } from "./functions";
import fs from "fs";
import path from "path";
import os from "os";

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

// convert env content to json
const newEnv = envToJson(env);

// if json file exists then write to it
// else write to console
if (jsonFile) {
  jsonFile = path.join(cwd, jsonFile);
  fs.writeFileSync(jsonFile, JSON.stringify(newEnv, null, 2));

  logThis(`Env file {${envFile}}${os.EOL}Converted to {${jsonFile}}`);
} else {
  logThis(JSON.stringify(newEnv, null, 2));
}
