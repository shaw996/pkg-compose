# pkgcompose

A cli fastly integrating groups of npm dependencies

# How to use pkgcompose?

1. Modify `.npmrc`

```text
pkgcompose=https://registry.npmjs.org/
registry=https://registry.npmmirror.com/
```

2. Run `npm install`

```shell
npm install -D pkgcompose
```

3. Add `pkgconfig.json` under root directory

- manager: Package manger which you would like to use
- pkgComposes: It's an array containes remote files named "pkg-compose.yaml". You can freely group dependencies you prefer.

```json
{
  "manager": "pnpm",
  "pkgComposes": [
    "https://raw.githubusercontent.com/shaw996/pkg-compose/main/packages/%40composes/v20.10.0/gitCommit/pkg-compose.yaml", //
    "https://raw.githubusercontent.com/shaw996/pkg-compose/main/packages/%40composes/v20.10.0/codeStyle/pkg-compose.yaml"
  ]
}
```

4. Run `npx pkgc run`

First of all, `pkgc` will read and compile pkgconfig.json.

Next, `pkgc` send request to fetch pkg-compose.yaml. After this, we will recognize pkg-compose.yaml, install dependencies defined in pkg-compose.yaml, modifiy package.json and download configure files if need to.
