import { Client } from 'minio';

const bucket = process.env.MINIO_BUCKET || 'ai-marketing-manager';
const client = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

for (let attempt = 1; attempt <= 20; attempt += 1) {
  try {
    if (!(await client.bucketExists(bucket))) await client.makeBucket(bucket);
    console.log(JSON.stringify({ level: 'info', event: 'bucket_ready', bucket }));
    process.exit(0);
  } catch (error) {
    if (attempt === 20) {
      console.error(JSON.stringify({ level: 'error', event: 'bucket_init_failed', message: error.message }));
      process.exit(1);
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}
