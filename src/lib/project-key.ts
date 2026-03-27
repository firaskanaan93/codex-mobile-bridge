import { Buffer } from "node:buffer";

export function encodeProjectKey(cwd: string): string {
  return Buffer.from(cwd, "utf8").toString("base64url");
}

export function decodeProjectKey(projectKey: string): string {
  return Buffer.from(projectKey, "base64url").toString("utf8");
}
