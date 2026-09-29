// Bundle the harness with esbuild (resolves import.meta.env + JSON imports) and run it.
import {build} from 'esbuild';import {spawnSync} from 'node:child_process';import fs from 'node:fs';
await build({entryPoints:['tests/gravitas-harness-main.mjs'],bundle:true,platform:'node',format:'esm',outfile:'.cache/gravitas-harness.bundle.mjs',define:{'import.meta.env.DEV':'false','import.meta.env':'{}'},logLevel:'error'});
const r=spawnSync(process.execPath,['.cache/gravitas-harness.bundle.mjs',...process.argv.slice(2)],{stdio:'inherit'});process.exit(r.status);
