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
console.log(); // new line

// simple logger
function logThis(message: string, exit?: number) {
  console.log(message);
  if (exit !== undefined) {
    console.log(); // new line
    process.exit(exit);
  }
}

// if init command is passed
// make config file in current working directory
if (command === "init") {
  // check if force is the last argument
  const force =
    subCommand === "force" || process.argv[process.argv.length - 1] === "force";

  // if config file already exists
  // then exit
  if (fs.existsSync(configPath)) {
    if (!force) {
      logThis("Config file already exists. Use 'force' to overwrite.", 1);
    }

    // delete old config file
    fs.unlinkSync(configPath);
  }

  // factory file path
  let factoryFile = path.join(__dirname, "factory/jsonbank.env.json");

  // subCommand is not "force"
  // then subCommand is the local path to factory file
  if (subCommand && subCommand !== "force") {
    factoryFile = path.join(cwd, subCommand);

    // check if factory file exists
    if (!fs.existsSync(factoryFile)) {
      logThis(`Factory file {${factoryFile}} does not exist.`, 1);
    }

    // log factory file path
    console.log("Factory File: ", factoryFile);
  }

  // copy factory file to config file
  fs.copyFileSync(factoryFile, configPath);

  // log success
  logThis("Config file created successfully.", 0);
}

// if is not init command
// then check if config file exists
if (!fs.existsSync(configPath)) {
  logThis(
    "Config file {jsonbank.env.json} not found. Use 'init' to create.",
    1
  );
}

// read config file
const config: {
  public_key: string;
  envs: { [local_path: string]: string };
} = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// validate config file
// that public_key is defined
if (!config.public_key) {
  logThis("Config file is not valid. {public_key} is not defined.", 1);
}

if (!config.envs) config.envs = {};

/**
 * Initialize JsonBank
 */
const jsb = new JsonBank({
  keys: { pub: config.public_key },
});

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
      logThis("Local path must be provided", 1);
    }

    await ProcessEnvs(command, subCommand!);
    process.exit(0);
  }

  // if no command is passed
  // list available commands
  const availableCommands = Object.keys(config.envs);
  if (availableCommands.length > 0) {
    console.log("Available Commands:");
    for (const command of availableCommands) {
      console.log(`npx jsonbank-env ${command} <filename>`);
    }
  } else {
    logThis("No commands available.", 1);
  }

  console.log(); // new line
}

// Run Main Function
Main().catch((error) => {
  console.log(error);
  process.exit(1);
});

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
      logThis(
        `Local file {${localFile}} already exists. Use 'force' to overwrite.`,
        1
      );
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
