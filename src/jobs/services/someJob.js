import { parentPort } from 'node:worker_threads';

async function sayHello() {
    console.log("This is the test function");
}

(async () => {
    await sayHello();

    if (parentPort) {
        parentPort.postMessage({ status: 'done' });
    }
})();