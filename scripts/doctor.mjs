import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

// Dependency-free installation check; does not read or reveal API keys.
const here = process.cwd();
const required = ['package.json','next.config.ts','app/page.tsx','app/console/page.tsx','README.md','.env.example'];
const missing = required.filter(file => !existsSync(join(here,file)));
console.log('\nQUORAIL / PROJECT PREFLIGHT');
console.log('Current folder:',here);
console.log('Node.js:',process.version);
console.log('Git checkout:',existsSync(join(here,'.git'))?'found':'not found (check repository directory)');
if(missing.length){
 console.error('Missing project files:',missing.join(', '));
 console.error('Extract the Quorail ZIP inside the cloned repository, then run this check again.');
 process.exitCode=1;
} else {
 const p=JSON.parse(readFileSync(join(here,'package.json'),'utf8'));
 console.log('Project:',p.name);
 console.log('Source structure: OK');
 if(Number(process.versions.node.split('.')[0])<22){console.error('Node.js 22 or newer is required.');process.exitCode=1;}
 console.log('Demo needs environment variables: NO');
 console.log('Live pilot needs separate database / agent signer / testnet vault: YES');
 console.log('Deployment instructions: docs/DEPLOYMENT.md\n');
}
