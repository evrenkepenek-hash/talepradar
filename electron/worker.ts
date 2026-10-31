import { scan } from '../src/core/scanner.ts';
import type { ScanInput } from '../src/core/scanner.ts';

interface WorkerPort { postMessage(message: unknown): void; on(event: 'message', callback: (event: { data: ScanInput }) => void): void }
const port = (process as unknown as { parentPort: WorkerPort }).parentPort;
port.on('message', async ({ data }) => {
  try {
    const result = await scan(data, new AbortController().signal, message => port.postMessage(message));
    port.postMessage({ type: 'done', ...result });
  } catch (error) { port.postMessage({ type: 'fatal', message: error instanceof Error ? error.message : 'Tarama tamamlanamadı.' }); }
});
