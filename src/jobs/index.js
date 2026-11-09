import Bree from 'bree';
import { jobList } from './list.js';

export const bree = new Bree({
    root: false,
    jobs: jobList,
    workerMessageHandler: (metadata) => {
        if (metadata.message && (metadata.message['watch:import'] || metadata.message['watch:require'])) {
            return;
        }

        console.log(`[Worker:${metadata.name}] Message: `, metadata.message)
    },
    errorHandler: (error, workerMetadata) => {
        console.error(`[Bree Error] Job ${workerMetadata.name} failed: `, error);
    }
});

export async function startScheduler() {
  await bree.start();
  console.log('[Scheduler] Bree worker thread scheduler started.');
}

export async function stopScheduler() {
  await bree.stop();
  console.log('[Scheduler] Bree worker thread scheduler stopped.');
}