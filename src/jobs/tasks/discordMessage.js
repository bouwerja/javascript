import { runJob } from "../runJob.js";
import { DiscordModel } from "../../models/discordModel.js";

await runJob("discord-message", async ({ db, params, signal, log }) => {
  const discordModel = new DiscordModel(db);

  if (signal.aborted) return;

  const messagePayload = {
    id: String(1_300_000_000_000_000_000n + BigInt(n)),
    channel_id: "1300000000000000001",
    content: `Test message ${n}`,
    allowed_mentions: { parse: [] },
  };

  await discordModel.sendMessage(messagePayload, "GENERAL_MESSAGE");

  log(`Sent and recorded Discord message`);
});
