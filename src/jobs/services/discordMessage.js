import { DiscordModel } from '../../models/discordModel.js';
import { parentPort } from 'node:worker_threads';

const messageDetails = {
    messageType: 1,
    payload: {
        content: "Hello <@452846771098484736>! This is a scheduler test message.",
        tts: false,
        embeds: [],
        allowed_mentions: {
            parse: ["users"],
        },
    }
};

(async () => {
    await DiscordModel.sendMessage(messageDetails);

    if (parentPort) {
        parentPort.postMessage({ status: 'done' });
    }
})();