import { Client } from 'minio';

const client = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});
const bucket = process.env.MINIO_BUCKET || 'ai-marketing-manager';

export function createMinioAdapter() {
  return {
    async check() {
      const exists = await client.bucketExists(bucket);
      if (!exists) throw new Error('Configured bucket does not exist');
    },
    async close() {},
  };
}
