import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import electron from 'electron';
import './build-electron.mjs';

await mkdir('.local-data', { recursive: true });
const server = await createServer();
await server.listen();
const env = { ...process.env, IZLEK_DEV_URL: 'http://127.0.0.1:5173', IZLEK_DATA_DIR: path.resolve('.local-data') };
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(electron, ['.'], { stdio: 'inherit', env, windowsHide: false });
child.on('exit', async code => { await server.close(); process.exit(code ?? 0); });
child.on('error', async error => { console.error(error); await server.close(); process.exit(1); });
process.on('SIGINT', () => child.kill());
