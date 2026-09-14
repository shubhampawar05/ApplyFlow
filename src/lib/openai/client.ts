import "server-only";
import OpenAI from "openai";
import { getOpenAiApiKey } from "./env";

let client: OpenAI | undefined;

export function getOpenAiClient() {
  if (!client) {
    client = new OpenAI({ apiKey: getOpenAiApiKey() });
  }
  return client;
}
