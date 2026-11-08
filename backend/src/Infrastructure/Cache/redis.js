import { createClient } from 'redis';

let client;
export function createRedisAdapter() {
  return {
    async check() {
      if (!client) {
        client = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
        client.on('error', (error) => console.error(JSON.stringify({ level: 'error', event: 'redis_client_error', message: error.message })));
        await client.connect().catch((error) => { client = undefined; throw error; });
      }
      await client.ping();
    },
    async close() {
      if (client?.isOpen) await client.quit();
      client = undefined;
    },
  };
}
