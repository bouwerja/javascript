import Bree from 'bree';
import { jobList } from './list.js';

let bree = null;

export async function startScheduler() {
  if (bree) return;

  bree = new Bree({
    root: false,
    jobs: jobList,
    timezone: 'Africa/Johannesburg',
    closeWorkerAfterMs: 5 * 60_000,

    workerMessageHandler: ({ name, message }) => {

      if (message === 'done') return;

      if (message && (message['watch:import'] || message['watch:require'])) return;

      console.log(`[Worker:${name}]`, message);
    },

    errorHandler: (error, { name }) => {
      console.error(`[Scheduler] Job "${name}" failed:`, error);
    },
  });

  await bree.start();
  console.log(`[Scheduler] Started ${jobList.length} job(s).`);
}

export async function stopScheduler() {
  if (!bree) return;

  await bree.stop();

  bree = null;
  
  console.log('[Scheduler] Stopped.');
}
