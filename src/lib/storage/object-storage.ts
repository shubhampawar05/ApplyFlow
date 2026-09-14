import "server-only";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getStorageClient } from "./client";
import { getStorageEnv } from "./env";

export async function uploadPrivateObject(input: {
  key: string;
  body: Uint8Array;
  contentType: string;
}) {
  const { bucket } = getStorageEnv();
  const client = getStorageClient();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );
}
