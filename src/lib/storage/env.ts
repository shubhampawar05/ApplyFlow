export type StorageEnv = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export function getStorageEnv(): StorageEnv {
  const endpoint = process.env.STORAGE_ENDPOINT;
  const region = process.env.STORAGE_REGION;
  const bucket = process.env.STORAGE_BUCKET;
  const accessKeyId = process.env.STORAGE_ACCESS_KEY;
  const secretAccessKey = process.env.STORAGE_SECRET_KEY;

  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing storage configuration. Set STORAGE_ENDPOINT, STORAGE_REGION, STORAGE_BUCKET, STORAGE_ACCESS_KEY, and STORAGE_SECRET_KEY.",
    );
  }

  return { endpoint, region, bucket, accessKeyId, secretAccessKey };
}
