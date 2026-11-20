import { runJob } from "../runJob.js";
import { DiscordModel } from "../../models/discordModel.js";
import { JOBS_USER_ID } from "../../constants/systemUsers.js";

await runJob("discord-message", async ({ db, params, signal, log }) => {
  const discordModel = new DiscordModel(db);

  if (signal.aborted) return;

  const messageText = "This is a test message";

  await discordModel.sendMessage(messageText, "GENERAL_MESSAGE", JOBS_USER_ID);

  log('Sent and recorded Discord message');
});
