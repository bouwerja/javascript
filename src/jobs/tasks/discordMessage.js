import { runJob } from "../runJob.js";
import { createDiscordClient } from "../clients/discordClient.js";
import { DiscordModel } from "../../models/discordModel.js";

await runJob("discord-message", async ({ db, params, signal, log }) => {
  const discord = createDiscordClient({
    botToken: process.env.DISCORD_BOT_TOKEN,
  });
  
  const discordModel = new DiscordModel(db);
  const channelId = process.env.DISCORD_GENERAL_CHANNEL_ID;

  if (signal.aborted) return;

  const sent = await discord.sendMessage(channelId, {
    content: params.content,
    allowed_mentions: { parse: [] },
  });

  try {
    const record = await discordModel.recordSentMessage(sent, {
      messageType: params.messageType,
    });
    log(`Sent and recorded Discord message ${record.discordId}.`);
  } catch (err) {
    log(`Message ${sent.id} was sent but could NOT be recorded.`);
    throw err;
  }
});
