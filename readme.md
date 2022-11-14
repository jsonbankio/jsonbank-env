# JsonBank Env

[Npm](https://www.npmjs.com/package/jsonbank-env) | [Github](https://https://github.com/jsonbankio/jsonbank-env.git)

## What is it?

A command line tool to Get your env files from the cloud as json.

**Save** as a `JSON` file remotely and **Load** it to your project as `ENV`.

## Menu

- [Usage](#installation)
- [Json Syntax](#json-syntax)
  - [Object](#object)
  - [Array of objects](#array-of-objects)
- [Configuration](#configuration)
  - [Create config file](#create-config-file)
  - [envs](#envs)
- [Commands](#commands)
  - [Load env](#load-env)
  - [Load from remote](#load-remote-file)

## Installation

You can use this via `npx` or install it globally.

```bash
npm i jsonbank-env
# or
npx jsonbank-env
```

## Json Syntax

The json file must be an `object` or an `array` of objects.

## Object

The object syntax `env` file is generated without empty lines.

```json
{
  "NODE_ENV": "development",
  "PORT": 3000,
  "SSL": null,
  "DB_HOST": "localhost",
  "DB_USER": "root",
  "DB_PASS": "root",
  "DB_NAME": "test"
}
```

Will generate the following `env` file:

```env
NODE_ENV="development"
PORT=3000
SSL=
DB_HOST="localhost"
DB_USER="root"
DB_PASS="root"
DB_NAME="test"
```

## Array of objects

The array of objects syntax `env` file is generated with empty lines between each object.

```json
[
  {
    "NODE_ENV": "development",
    "PORT": 3000,
    "SSL": null
  },
  "Comment: Database Configuration",
  {
    "DB_HOST": "localhost",
    "DB_USER": "root",
    "DB_PASS": "root",
    "DB_NAME": "test"
  }
]
```

Will generate the following `env` file:

```env
NODE_ENV="development"
PORT=3000
SSL=

# Comment: Database Configuration
DB_HOST="localhost"
DB_USER="root"
DB_PASS="root"
DB_NAME="test"
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
    dev: "project/file.json",
  },
}
```

Insert your [public key](https://jsonbank.io/settings/api) in the `public_key` field.

### envs

The `envs` config is where you define the jsonbank remote url of your json files. Given that

- **Project Name** on jsonbank is `envs`
- **File Path** is `file.json`

your config will look like this:

```json
{
  "public_key": "public_key",
  "envs": {
    "dev": "envs/file.json"
  }
}
```

## Commands

Using the example config file below:

```json
{
  "public_key": "public_key",
  "envs": {
    "dev": "envs/default.json",
    "prod": "envs/prod.json"
  }
}
```

### Load env

```bash
# Load env to custom local file
npx jsonbank-env <env> <local_path>

# Load env to custom local file and force overwrite
npx jsonbank-env <env> <local_path> force


# Using the example config above
# The command below will load remote "envs/prod.json" to ".env"
npx jsonbank-env prod .env
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


### Env to Json
How to convert a env file to a json file?
We got you covered. You don't need any initialization or configuration. Just run the following command and you are good to go.

```bash
# convert json to env and log to console (.env is the default input file)
npx jsonbank-env json

# convert json to env and log to console (custom input file)
npx jsonbank-env json <env_path>

# convert json to env and save to file (custom input file)
npx jsonbank-env json <env_path> <json_path>
```