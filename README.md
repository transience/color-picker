# color-picker

## Usage

```bash
$ npm install # or pnpm install or yarn install
```

## Available Scripts

In the package directory, you can run:

### `npm run validate` 

Runs the scripts to check your package: 

**`npm run lint`**
Run `eslint`

**`npm run typecheck`**
Run `tsc` without emitting files

**`npm run test:coverage`**
Run all tests with `vitest`

**`npm run build`**
Run the build with `tsup` that generates both `esm` and `commonjs` bundles

**`npm run size`**
Check the bundle size with `size-limit`

> This runs on the CI and with the `prepublish` script.

### `npm run build`

Builds the package for production in the `dist` folder.<br>
Your package is ready to be deployed!

### `npm run watch`
Build the package and wait to regenerate the files on change.