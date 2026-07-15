import { describe, it, mock, afterEach } from "node:test";
import assert from "node:assert/strict";
import os from "os";
import {
  envToJson,
  jsonArrayToEnv,
  jsonToEnv,
  logThis,
} from "../functions";

const EOL = os.EOL;

describe("logThis", () => {
  afterEach(() => mock.restoreAll());

  it("logs the message to the console", () => {
    const log = mock.method(console, "log", () => {});

    logThis("hello world");

    assert.equal(log.mock.callCount(), 1);
    assert.deepEqual(log.mock.calls[0].arguments, ["hello world"]);
  });

  it("does not exit when no exit code is passed", () => {
    mock.method(console, "log", () => {});
    const exit = mock.method(process, "exit", (() => {}) as never);

    logThis("no exit");

    assert.equal(exit.mock.callCount(), 0);
  });

  it("logs an extra new line and exits with the given code", () => {
    const log = mock.method(console, "log", () => {});
    const exit = mock.method(process, "exit", (() => {}) as never);

    logThis("bye", 1);

    assert.equal(log.mock.callCount(), 2);
    assert.deepEqual(log.mock.calls[1].arguments, []);
    assert.equal(exit.mock.callCount(), 1);
    assert.deepEqual(exit.mock.calls[0].arguments, [1]);
  });

  it("exits even when exit code is 0", () => {
    mock.method(console, "log", () => {});
    const exit = mock.method(process, "exit", (() => {}) as never);

    logThis("done", 0);

    assert.equal(exit.mock.callCount(), 1);
    assert.deepEqual(exit.mock.calls[0].arguments, [0]);
  });
});

describe("jsonToEnv", () => {
  it("wraps string values in double quotes", () => {
    assert.equal(
      jsonToEnv({ NODE_ENV: "development" }),
      `NODE_ENV="development"${EOL}`
    );
  });

  it("writes numbers as they are", () => {
    assert.equal(jsonToEnv({ PORT: 3000 }), `PORT=3000${EOL}`);
  });

  it("writes booleans as they are", () => {
    assert.equal(
      jsonToEnv({ DEBUG: true, CACHE: false }),
      `DEBUG=true${EOL}CACHE=false${EOL}`
    );
  });

  it("writes null values as empty", () => {
    assert.equal(jsonToEnv({ SSL: null }), `SSL=${EOL}`);
  });

  it("writes undefined values as empty", () => {
    assert.equal(
      jsonToEnv({ SSL: undefined } as any),
      `SSL=${EOL}`
    );
  });

  it("skips nested objects and arrays", () => {
    assert.equal(
      jsonToEnv({ NESTED: { a: 1 }, LIST: [1, 2], KEPT: "yes" } as any),
      `KEPT="yes"${EOL}`
    );
  });

  it("returns an empty string for an empty object", () => {
    assert.equal(jsonToEnv({}), "");
  });

  it("wraps '!' prefixed keys in single quotes and strips the marker", () => {
    assert.equal(
      jsonToEnv({ "!SECRET_KEY": "a $peci@l k3y" }),
      `SECRET_KEY='a $peci@l k3y'${EOL}`
    );
  });

  it("single quotes non-string values of '!' prefixed keys", () => {
    assert.equal(
      jsonToEnv({ "!PORT": 3000, "!DEBUG": true }),
      `PORT='3000'${EOL}DEBUG='true'${EOL}`
    );
  });

  it("writes null values of '!' prefixed keys as empty", () => {
    assert.equal(jsonToEnv({ "!SSL": null }), `SSL=${EOL}`);
  });

  it("skips nested objects even with the '!' marker", () => {
    assert.equal(jsonToEnv({ "!NESTED": { a: 1 } } as any), "");
  });

  it("converts the readme example correctly", () => {
    const env = jsonToEnv({
      NODE_ENV: "development",
      PORT: 3000,
      SSL: null,
      DB_HOST: "localhost",
      DB_USER: "root",
      DB_PASS: "root",
      DB_NAME: "test",
    });

    assert.equal(
      env,
      [
        `NODE_ENV="development"`,
        `PORT=3000`,
        `SSL=`,
        `DB_HOST="localhost"`,
        `DB_USER="root"`,
        `DB_PASS="root"`,
        `DB_NAME="test"`,
        ``,
      ].join(EOL)
    );
  });
});

describe("jsonArrayToEnv", () => {
  it("turns string items into comments", () => {
    assert.equal(
      jsonArrayToEnv(["A comment"]),
      `# A comment${EOL}`
    );
  });

  it("adds a blank line between objects", () => {
    const env = jsonArrayToEnv([{ A: "1" }, { B: "2" }]);

    assert.equal(env, `A="1"${EOL}${EOL}B="2"${EOL}${EOL}`);
  });

  it("returns an empty string for an empty array", () => {
    assert.equal(jsonArrayToEnv([]), "");
  });

  it("converts the readme example correctly", () => {
    const env = jsonArrayToEnv([
      { NODE_ENV: "development", PORT: 3000, SSL: null },
      "Comment: Database Configuration",
      { DB_HOST: "localhost", DB_USER: "root", DB_PASS: "root" },
    ]);

    assert.equal(
      env,
      [
        `NODE_ENV="development"`,
        `PORT=3000`,
        `SSL=`,
        ``,
        `# Comment: Database Configuration`,
        `DB_HOST="localhost"`,
        `DB_USER="root"`,
        `DB_PASS="root"`,
        ``,
        ``,
      ].join(EOL)
    );
  });
});

describe("envToJson", () => {
  it("parses a flat env into a single object", () => {
    const json = envToJson(
      [`NODE_ENV="development"`, `PORT=3000`].join(EOL)
    );

    assert.deepEqual(json, { NODE_ENV: "development", PORT: "3000" });
  });

  it("parses empty values as empty strings", () => {
    assert.deepEqual(envToJson(`SSL=`), { SSL: "" });
  });

  it("keeps comment lines as strings and forces array format", () => {
    const json = envToJson(
      [`# a comment`, `A=1`].join(EOL)
    );

    assert.deepEqual(json, ["a comment", { A: "1" }]);
  });

  it("splits a group at an inline comment", () => {
    const json = envToJson(
      [`A=1`, `# between`, `B=2`].join(EOL)
    );

    assert.deepEqual(json, [{ A: "1" }, "between", { B: "2" }]);
  });

  it("keeps '#' prefixed lines without spaces as comments", () => {
    const json = envToJson(
      [`#Hello="this will be commented"`, `A=1`].join(EOL)
    );

    assert.deepEqual(json, [`Hello="this will be commented"`, { A: "1" }]);
  });

  it("splits groups on blank lines into an array of objects", () => {
    const json = envToJson(
      [`A=1`, `B=2`, ``, `C=3`].join(EOL)
    );

    assert.deepEqual(json, [{ A: "1", B: "2" }, { C: "3" }]);
  });

  it("keeps a single object when the only blank line is the last line", () => {
    const json = envToJson([`A=1`, `B=2`, ``].join(EOL));

    assert.deepEqual(json, { A: "1", B: "2" });
  });

  it("keeps a header comment followed by a blank line as a string", () => {
    const json = envToJson(
      [`# header`, ``, `A=1`, `B=2`].join(EOL)
    );

    assert.deepEqual(json, ["header", { A: "1", B: "2" }]);
  });

  it("ignores a leading blank line", () => {
    const json = envToJson([``, `A=1`, `B=2`].join(EOL));

    assert.deepEqual(json, { A: "1", B: "2" });
  });

  it("prefixes keys of single quoted values with '!'", () => {
    const json = envToJson(
      [`SECRET_KEY='a $peci@l k3y'`, `NORMAL="plain"`, `RAW=1`].join(EOL)
    );

    assert.deepEqual(json, {
      "!SECRET_KEY": "a $peci@l k3y",
      NORMAL: "plain",
      RAW: "1",
    });
  });

  it("prefixes single quoted keys inside groups with '!'", () => {
    const json = envToJson(
      [`A='1'`, `B=2`, ``, `C='3'`].join(EOL)
    );

    assert.deepEqual(json, [{ "!A": "1", B: "2" }, { "!C": "3" }]);
  });

  it("supports 'export' prefixed single quoted values", () => {
    const json = envToJson(`export SECRET='sh'`);

    assert.deepEqual(json, { "!SECRET": "sh" });
  });

  it("does not mark an empty single quoted pair of quotes as double quoted", () => {
    const json = envToJson(`EMPTY=''`);

    assert.deepEqual(json, { "!EMPTY": "" });
  });

  it("treats consecutive blank lines as one group separator", () => {
    const json = envToJson(
      [`A=1`, ``, ``, `B=2`].join(EOL)
    );

    assert.deepEqual(json, [{ A: "1" }, { B: "2" }]);
  });

  it("converts the readme example correctly", () => {
    const json = envToJson(
      [
        `NODE_ENV="development"`,
        `PORT=3000`,
        `SSL=`,
        ``,
        `# Comment: Database Configuration`,
        `DB_HOST="localhost"`,
        `DB_USER="root"`,
        `DB_PASS="root"`,
        `DB_NAME="test"`,
      ].join(EOL)
    );

    assert.deepEqual(json, [
      { NODE_ENV: "development", PORT: "3000", SSL: "" },
      "Comment: Database Configuration",
      {
        DB_HOST: "localhost",
        DB_USER: "root",
        DB_PASS: "root",
        DB_NAME: "test",
      },
    ]);
  });
});

describe("round trip", () => {
  it("json -> env -> json returns the same data (values as strings)", () => {
    const source = { A: "1", B: "two", C: "" };
    const env = jsonToEnv(source);

    assert.deepEqual(envToJson(env), source);
  });

  it("json array -> env -> json keeps the groups and comments", () => {
    const source = [{ A: "1", B: "2" }, "Group two", { C: "3" }];
    const env = jsonArrayToEnv(source).trim();

    assert.deepEqual(envToJson(env), source);
  });

  it("json -> env -> json keeps '!' single quote markers", () => {
    const source = { "!SECRET_KEY": "a $peci@l k3y", NORMAL: "plain" };
    const env = jsonToEnv(source);

    assert.equal(
      env,
      `SECRET_KEY='a $peci@l k3y'${EOL}NORMAL="plain"${EOL}`
    );
    assert.deepEqual(envToJson(env), source);
  });

  it("env -> json -> env keeps single quoted values single quoted", () => {
    const env = `SECRET_KEY='a $peci@l k3y'${EOL}NORMAL="plain"`;
    const json = envToJson(env) as Record<string, string>;

    assert.equal(jsonToEnv(json).trim(), env);
  });
});
