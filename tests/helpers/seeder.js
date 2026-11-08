import { users } from '../../src/db/users.js';
import { products } from '../../src/db/products.js';

const DEFAULT_COUNTS = {
  usersCount: Number(process.env.SEED_USERS_COUNT) || 10,
  productsCount: Number(process.env.SEED_PRODUCTS_COUNT) || 20
};

export async function seedTestDatabase(drizzleClient, customCounts = {}) {
  const config = { ...DEFAULT_COUNTS, ...customCounts };

  if (config.usersCount > 0) {
    const fakeUsers = Array.from({ length: config.usersCount }, (_, i) => ({
      name: `Test User ${i + 1}`,
      email: `user${i + 1}_${Date.now()}@example.com`,
      role: i === 0 ? 'admin' : 'user'
    }));

    await drizzleClient.insert(users).values(fakeUsers);
  }

  if (config.productsCount > 0) {
    const fakeProducts = Array.from({ length: config.productsCount }, (_, i) => ({
      name: `Product ${i + 1}`,
      price: (Math.random() * 100 + 10).toFixed(2)
    }));

    await drizzleClient.insert(products).values(fakeProducts);
  }

  if (config.discordMessageCount > 0) {
    const fakeMessages = Array.from({ length: config.messageCount }, (_, i) => ({
      messageText: `Fake message number ${i + 1}`,
      messageType: 1,
      details: `{ "id": ${i + 1},  "messageText" : "Fake message number ${i + 1}, "messageType": 1 }`
    }))
  }
}