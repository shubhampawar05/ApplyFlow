export function mimeTypeFromStorageKey(storageKey: string) {
  const lower = storageKey.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "image/jpeg";
}

export function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}
