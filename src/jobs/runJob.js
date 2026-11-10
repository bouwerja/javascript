import { parentPort, workerData } from 'node:worker_threads';


export async function runJob(name, task, { usesDatabase = true } = {}) {

  const log = (...args) => console.log(`[Job:${name}]`, ...args);

  const { job: _breeMeta, ...params } = workerData ?? {};

  const controller = new AbortController();
  const onMessage = (message) => {
    if (message === 'cancel') {
      log('Cancellation requested; finishing the current step.');
      controller.abort();
    }
  };

  parentPort?.on('message', onMessage);

  const started = Date.now();

  let pool;

  try {
    let db;
    if (usesDatabase) {
      ({ db, pool } = await import('../db/index.js'));
    }

    await task({ db, params, signal: controller.signal, log });

    log(`Completed in ${Date.now() - started} ms.`);

  } finally {

    parentPort?.off('message', onMessage);
    if (pool) await pool.end();
  }

  parentPort?.postMessage('done');
}
