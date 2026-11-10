import { fileURLToPath } from 'node:url';
import path from 'node:path';

const TASKS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'tasks');
const taskPath = (file) => path.join(TASKS_DIR, file);


export const jobList = [
  {
    name: 'discord-message',
    path: taskPath('discordMessage.js'),
    cron: '0 8 * * 1-5',               // 08:00 on weekdays
    closeWorkerAfterMs: 2 * 60_000,    // 2 minutes
    worker: {
      workerData: {
        messageType: 1,
        content: 'Good morning. This is a scheduled test message.',
      },
    },
  },
  
];
