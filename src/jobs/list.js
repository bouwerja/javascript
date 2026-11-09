import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const jobList = [

    {
        name: 'test',
        path: path.join(__dirname, 'services', 'someJob.js'),
        cron: '*/1 * * * *',
    },

    {
        name: 'discord-message',
        path: path.join(__dirname, 'services', 'discordMessage.js'),
        cron: '*/1 * * * *',
    },

];