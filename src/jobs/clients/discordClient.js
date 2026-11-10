const DISCORD_API_BASE = 'https://discord.com/api/v10';
const DEFAULT_TIMEOUT_MS = 10_000;


export class DiscordApiError extends Error {
  constructor(discordStatus, body) {
    super(`Discord API error [${discordStatus}]`);
    this.name = 'DiscordApiError';
    this.discordStatus = discordStatus;
    this.body = body;
  }
}


export function createDiscordClient({ botToken, fetchImpl = globalThis.fetch, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (!botToken) {
    throw new Error('[DiscordClient] botToken is required (check DISCORD_BOT_TOKEN).');
  }

  async function request(method, path, body) {

    const response = await fetchImpl(`${DISCORD_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bot ${botToken}`,
        ...(body && { 'Content-Type': 'application/json' }),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });

    const text = await response.text();
    const data = text ? tryParseJson(text) : null;

    if (!response.ok) {
      throw new DiscordApiError(response.status, data ?? text);
    }

    return data;
  }

  return {
    async sendMessage(channelId, payload) {

      if (!channelId) {
        throw new Error('[DiscordClient] channelId is required (check DISCORD_GENERAL_CHANNEL_ID).');
      }

      if (!payload?.content && !payload?.embeds?.length) {
        throw new Error('[DiscordClient] A message needs content or at least one embed.');
      }

      return request('POST', `/channels/${channelId}/messages`, payload);
    },

    async getLatestMessage(channelId) {

      if (!channelId) {
        throw new Error('[DiscordClient] channelId is required.');
      }

      const [latest] = await request('GET', `/channels/${channelId}/messages?limit=1`);
      
      return latest ?? null;
    },
  };
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
