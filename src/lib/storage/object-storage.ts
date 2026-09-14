import "server-only";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
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

export async function downloadPrivateObject(key: string) {
  const { bucket } = getStorageEnv();
  const client = getStorageClient();
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

  if (!response.Body) {
    throw new Error("STORAGE_OBJECT_NOT_FOUND");
  }

  return new Uint8Array(await response.Body.transformToByteArray());
}
