#!/usr/bin/env node

import path from "path";
import fs from "fs";
import * as os from "os";
import { JsonBank } from "jsonbank";

const command: "init" | "force" | string | undefined = process.argv[2] as any;
const subCommand: "force" | string | undefined = process.argv[3] as any;

// get current working directory
const cwd = process.cwd();
// get config file path
const configPath = path.join(cwd, "jsonbank.env.json");

// if init command is passed
// make config file in current working directory
if (command === "init") {
  // if config file already exists
  // then exit
  if (fs.existsSync(configPath) && subCommand !== "force") {
    if (subCommand !== "force") {
      console.log("Config file already exists. Use 'force' to overwrite.");
      process.exit(0);
    }

    // delete old config file
    fs.unlinkSync(configPath);
  }

  // create config file from factory
  const factoryFile = path.join(__dirname, "factory/jsonbank.env.json");

  // copy factory file to config file
  fs.copyFileSync(factoryFile, configPath);

  // log success
  console.log("Config file created successfully.");

  process.exit(0);
}

// if is not init command
// then check if config file exists
if (!fs.existsSync(configPath)) {
  console.log(
    "Config file {jsonbank.env.json} not found. Use 'init' to create."
  );
  process.exit(1);
}

// read config file
const config: {
  public_key: string;
  envs: { [local_path: string]: string };
} = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// validate config file
// that public_key is defined
if (!config.public_key) {
  console.log("Config file is not valid. {public_key} is not defined.");
  process.exit(1);
}

if (!config.envs) config.envs = {};

// Make Main Function
// To enable async await
async function Main() {
  const hasCommand = command !== undefined && command !== "force";

  // if command is passed
  // then subCommand must be passed
  // because command = remote path
  // and subCommand = local path
  if (hasCommand) {
    if (!subCommand) {
      console.log("Local path must be provided");
      process.exit(1);
    }

    await ProcessEnvs(command, subCommand);
    process.exit(0);
  }

  // if no command is passed
  // then process all envs
  for (const localPath in config.envs) {
    const remotePath = config.envs[localPath];
    await ProcessEnvs(remotePath, localPath, command === "force");
  }

  process.exit(0);
}

/**
 * Initialize JsonBank
 */
const jsb = new JsonBank({
  keys: { pub: config.public_key },
});

// Run Main Function
Main().catch((error) => {
  console.log(error);
  process.exit(1);
});

// /**
//  * Gets json content from remote file
//  */
// function getJsonContent(file: string) {
//   return jsb.getOwnContent(file);
// }

async function ProcessEnvs(
  remoteFile: string,
  localFile: string,
  force = false
) {
  localFile = path.join(cwd, localFile!);

  if (config.envs[remoteFile]) {
    remoteFile = config.envs[remoteFile];
  }

  // check if local file is defined
  // if it is defined stop unless "force" is passed
  if (fs.existsSync(localFile)) {
    force = force || process.argv[4] === "force";

    if (!force) {
      console.log(
        `Local file {${localFile}} already exists. Use 'force' to overwrite.`
      );
      process.exit(0);
    }

    // delete old local file
    fs.unlinkSync(localFile);
  }

  // log remote file path
  console.log(`Fetching Remote: ${remoteFile}`);

  // get json content
  const jsonContent = await jsb.getOwnContent(remoteFile);

  // convert json to env format
  const envContent = jsonToEnv(jsonContent);

  // log local file path
  console.log(`Saving to Local: ${localFile}`);
  // write env content to local file
  fs.writeFileSync(localFile, envContent);

  // log success
  console.log("===== Completed =====");
}

/**
 * Converts json to env format
 * @param data
 */
function jsonToEnv(data: Record<string, any>) {
  let env = "";
  for (const key in data) {
    // wrap all string values with double quotes
    const value = typeof data[key] === "string" ? `"${data[key]}"` : data[key];
    env += `${key}=${value}${os.EOL}`;
  }

  return env;
}
