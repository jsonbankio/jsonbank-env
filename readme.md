# JsonBank Env

[Npm](https://www.npmjs.com/package/jsonbank-env) | [Github](https://https://github.com/jsonbankio/jsonbank-env.git)

## What is it?
A command line tool to Get your env files from the cloud as json.

**Save** as a `JSON` file remotely and **Load** it to your project as `ENV`.

## Menu

- [Usage](#usage)
- [Configuration](#configuration)
  - [Create config file](#create-config-file)
  - [envs](#envs)
- [Commands](#commands)
  - [Load from config](#load-from-config)
  - [Load from remote](#load-remote-file)

## Usage

You can use this via `npx` or install it globally.

```bash
npx jsonbank-env <args>
```

## Configuration

A `jsonbank.env.json` Configuration file is required. This is where the [public key](https://jsonbank.io/settings/api) will be defined.

### Create config file.

```bash
# Create a config file
npx jsonbank-env init

# Create a config file and force overwrite
npx jsonbank-env init force

# Create a config file from custom factory file
npx jsonbank-env init "path/to/factory/file.json"

# Create a config file from custom factory file and force overwrite
npx jsonbank-env init "path/to/factory/file.json" force
```

The following file will be created.

```json5
{
  public_key: "",
  envs: {
    ".env": "project/file.json",
  },
}
```

Insert your [public key](https://jsonbank.io/settings/api) in the `public_key` field.

### envs

The `envs` config is where you define the paths to `ENV` file and the `JSON` file in the cloud.

- `key` is the relative path to the local env file
- `value` is the relative path to the remote json file

Given that:

- **Project Name** on jsonbank is `envs`
- **File Path** is `file.json`
- we want it to be saved as `.env` in the project

your config will look like this:

```json
{
  "public_key": "public_key",
  "envs": {
    ".env": "envs/file.json"
  }
}
```

## Commands

Using the example config file below:

```json
{
  "public_key": "public_key",
  "envs": {
    ".env": "envs/default.json",
    ".prod.env": "envs/prod.json"
  }
}
```

### Load from config

```bash
# Load envs from config file
npx jsonbank-env

# Load envs from config file and force overwrite
npx jsonbank-env force
```

if you want to load a `registered` env file to a custom local file, you can do it like this:

```bash
# Load env to custom local file
npx jsonbank-env <env_key> <local_path>

# Load env to custom local file and force overwrite
npx jsonbank-env <env_key> <local_path> force


# Using the example config above
# The command below will load remote "envs/prod.json" to ".env"
npx jsonbank-env .prod.env .env

```

### Load Remote file

```bash
# Load remote file
npx jsonbank-env <remote_path> <local_path>

# Load remote file and force overwrite
npx jsonbank-env <remote_path> <local_path> force

# The command below will load remote "envs/prod.json" to ".env"
npx jsonbank-env envs/prod.json .env
```
