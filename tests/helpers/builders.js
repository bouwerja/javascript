/**
 * Test data builders.
 *
 * Each builder returns valid data with unique values. Override only the fields
 * your test cares about:
 *
 *   buildUser()                              -> { name: 'Test User 1', email: 'user1@example.com' }
 *   buildUser({ email: 'dup@example.com' })  -> same, with your email
 *
 * Unique values come from a counter (not Date.now(), which can repeat within
 * the same millisecond and cause random duplicate-key failures).
 */

let sequence = 0;
const next = () => ++sequence;

/** Valid input for UserModel.create() or POST /users. */
export function buildUser(overrides = {}) {
  const n = next();
  return {
    name: `Test User ${n}`,
    email: `user${n}@example.com`,
    ...overrides,
  };
}

/**
 * A message object shaped like the Discord API's response.
 * IDs are realistic 64-bit snowflakes (as strings), so tests catch
 * code that assumes they fit in a 32-bit integer.
 */
export function buildDiscordApiMessage(overrides = {}) {
  const n = next();
  return {
    id: String(1_300_000_000_000_000_000n + BigInt(n)),
    channel_id: '1300000000000000001',
    content: `Test message ${n}`,
    ...overrides,
  };
}
