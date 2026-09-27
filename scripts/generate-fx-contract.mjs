import { readFile, writeFile } from 'node:fs/promises';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { _ } from 'ajv/dist/compile/codegen/index.js';
import standalone from 'ajv/dist/standalone/index.js';
import { compile } from 'json-schema-to-typescript';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
const directory = new URL('../apps/shared/fx/', import.meta.url);
const formatting = await resolveConfig(fileURLToPath(directory));
const check = process.argv.includes('--check');
async function artifact(name, contents) {
  const path = new URL(name, directory);
  const output = await format(contents, { ...formatting, filepath: fileURLToPath(path) });
  if (check) {
    if ((await readFile(path, 'utf8').catch(() => '')) !== output) {
      console.error(`FX generated artifact differs: ${name}`);
      process.exitCode = 1;
    }
  } else await writeFile(path, output);
}
const schema = JSON.parse(await readFile(new URL('schema.json', directory), 'utf8'));
const ajv = new Ajv({
  inlineRefs: false,
  code: { source: true, esm: true, formats: _`formats` },
  strict: true,
});
addFormats(ajv);
ajv.addSchema(schema);
const exports = Object.fromEntries(
  Object.keys(schema.$defs).map((name) => [`validate${name}`, `${schema.$id}#/$defs/${name}`]),
);
const bundled = await build({
  stdin: {
    contents: `import { fullFormats as formats } from 'ajv-formats/dist/formats.js';\n${standalone(ajv, exports)}`,
    resolveDir: fileURLToPath(new URL('../', import.meta.url)),
    sourcefile: 'fx-validators.js',
  },
  bundle: true,
  platform: 'browser',
  format: 'esm',
  write: false,
});
await artifact('validators.js', `/* eslint-disable */\n${bundled.outputFiles[0].text}`);
const generatedTypes = await compile(schema, 'FxContract', {
  additionalProperties: false,
  unreachableDefinitions: true,
});
await artifact('types.ts', generatedTypes.replace(/^\/\* eslint-disable \*\/\n/, ''));
await artifact(
  'validators.d.ts',
  `import type { ${Object.keys(schema.$defs).join(', ')} } from './types';\n${Object.keys(
    schema.$defs,
  )
    .map((name) => `export declare function validate${name}(value: unknown): value is ${name};`)
    .join('\n')}\n`,
);
const runtime = await build({
  entryPoints: [fileURLToPath(new URL('index.ts', directory))],
  bundle: true,
  platform: 'neutral',
  format: 'esm',
  conditions: ['import', 'default'],
  write: false,
  minify: true,
});
await artifact('runtime.mjs', `/* eslint-disable */\n${runtime.outputFiles[0].text}`);
