# Contributing

## Fork setup

- GitHub Pages
   - Settings > Pages > Source, change to "GitHub Actions"
- Environments
   - `build-production`
      - Secrets
         - `AZDO_NPM_REGISTRY_PASSWORD` set to the password to log into your reputable NPM registry
      - Environment variables
         - `AZDO_NPM_REGISTRY_URL` set to a reputable NPM registry
         - `AZDO_NPM_REGISTRY_USERNAME` set to the username to log into your reputable NPM registry
   - `npm-publish`
   - `pull-request`
      - Secrets
         - `GH_TOKEN` set to a PAT token which enabled "Read and Write access to code and pull requests" in your fork

Note: reputable NPM registry is an NPM registry that you can timely disable vulnerable packages.

## First time setup

Run `npm install`.

## Build

- All projects
   - One-off build: `npm run build`
   - Watched build: `npm start`
- Single project
   - One-off build: `cd packages/your-package` followed by `npm run build`
   - Watched build: `cd packages/your-package` followed by `npm start`

## Test

- All projects
   - One-off test: `npm test`
- Single project
   - One-off test: `cd packages/your-package` followed by `npm test`
   - Watched test: `cd packages/your-package` followed by `npm test -- --watch`

## Advanced topics

### Package requirements (a.k.a. contract)

Every package in this monorepo is bound to this contract. We tried to make the contract as minimal as possible so everyone can be as flexible as they want.

- General
   - Must be able to build at both root-level and package-level
   - Recommended to use unified configuration under `/configs/`, okay to eject
   - Do not interfere with other packages
   - Must not depends on non-public packages
- Scripts
   - `npm run build` to build
   - `npm run precommit` to run static code analysis
   - `npm test` to run build-validation tests
   - (Optional) `npm start` to run watched build
   - (Optional, Linux-only) `npm run bump` to bump dependencies automatically
- Targeting
   - Packages that works on browser must target ES5
   - Packages that works on browser must not depends any Node.js, Browserify, Webpack, and other bridging packages
   - Packages that works on Node.js must target LTS or lower
- Exports
   - Must export default entrypoints (`main`/`module`/`types` field)
   - Must export both CommonJS and ES Modules entrypoint in ES5 flavor
   - Must export type declarations
   - Must exclude non-production code in tarball, such as tests and TypeScript
   - Recommended to export source maps of production code
   - Recommended to export ES Modules in ESNext flavor with `esnext` condition
- Tests
   - Tests must be runnable under Node LTS on Linux
- Pull request validation
   - Must run all types of tests available in the repo
   - When pull requests are merged, the package must work as intended

### Adding new package

Steps:

1. Clone from any packages and remove most of its contents
   - TBD: We do not have a template yet
1. Add the package to `/package.json/workspaces`
   - Make sure you added your dependency in the order they should be built
   - NPM workspace do not sort dependency automatically. According to [NPM doc](https://docs.npmjs.com/cli/v9/using-npm/workspaces#running-commands-in-the-context-of-workspaces): "Commands will be run in each workspace in the order they appear in your `package.json`."
1. Update `.github/workflows/pull-request-validation.yml/jobs/sanity-check` job to include your package under `strategy.matrix.package-name`
