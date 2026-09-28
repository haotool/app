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
// Consumer（tolerant reader）與 producer（嚴格模式）兩組 validator 皆由同一 schema SSOT 產生。
function closeObjects(node) {
  if (Array.isArray(node)) return node.map(closeObjects);
  if (node === null || typeof node !== 'object') return node;
  const copy = Object.fromEntries(Object.entries(node).map(([k, v]) => [k, closeObjects(v)]));
  if (copy.properties && copy.additionalProperties === undefined) copy.additionalProperties = false;
  return copy;
}
async function standaloneValidators(contract, prefix) {
  const ajv = new Ajv({
    inlineRefs: false,
    code: { source: true, esm: true, formats: _`formats` },
    strict: true,
  });
  addFormats(ajv);
  ajv.addKeyword('x-ecbObsStatus');
  ajv.addSchema(contract);
  const exports = Object.fromEntries(
    Object.keys(contract.$defs).map((name) => [
      `${prefix}${name}`,
      `${contract.$id}#/$defs/${name}`,
    ]),
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
  return `/* eslint-disable */\n${bundled.outputFiles[0].text}`;
}
await artifact('validators.js', await standaloneValidators(schema, 'validate'));
// producer 嚴格模式：只供發布端（Node）使用，不進 App bundle；拼錯或未知欄位一律拒絕。
await artifact(
  'producer-validators.js',
  await standaloneValidators(closeObjects(schema), 'validateProducer'),
);
const generatedTypes = await compile(schema, 'FxContract', {
  additionalProperties: false,
  unreachableDefinitions: true,
});
// 根層級只含 $defs（無 oneOf），根型別僅為命名空間，不輸出 index-signature 介面。
await artifact(
  'types.ts',
  generatedTypes
    .replace(/^\/\* eslint-disable \*\/\n/, '')
    .replace(/export interface FxContract \{\n {2}\[k: string\]: unknown;\n\}\n/, ''),
);
await artifact(
  'producer-validators.d.ts',
  `import type { ${Object.keys(schema.$defs).join(', ')} } from './types';\n${Object.keys(
    schema.$defs,
  )
    .map(
      (name) =>
        `export declare function validateProducer${name}(value: unknown): value is ${name};`,
    )
    .join('\n')}\n`,
);
await artifact(
  'validators.d.ts',
  `import type { ${Object.keys(schema.$defs).join(', ')} } from './types';\n${Object.keys(
    schema.$defs,
  )
    .map((name) => `export declare function validate${name}(value: unknown): value is ${name};`)
    .join('\n')}\n`,
);
