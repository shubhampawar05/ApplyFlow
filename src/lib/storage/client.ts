import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
import { getStorageEnv } from "./env";

let client: S3Client | undefined;

export function getStorageClient() {
  if (!client) {
    const { endpoint, region, accessKeyId, secretAccessKey } = getStorageEnv();
    client = new S3Client({
      forcePathStyle: true,
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return client;
}
