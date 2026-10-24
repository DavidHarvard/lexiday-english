import {build} from 'esbuild';
await build({entryPoints:['server/worker.js'],outfile:'dist/_worker.js',bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true});
console.log('Built Cloudflare Pages backend: dist/_worker.js');
