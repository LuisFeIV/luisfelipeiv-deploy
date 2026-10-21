import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getStore } from "@netlify/blobs";

const localMediaDirectory = path.join(process.cwd(), ".local-media");

function getMediaStore() {
  return getStore("luisfelipeiv-media", { consistency: "strong" });
}

export async function saveSiteMedia(key: string, data: Uint8Array) {
  if (process.env.NETLIFY === "true") {
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    await getMediaStore().set(key, copy.buffer);
    return;
  }

  await mkdir(localMediaDirectory, { recursive: true });
  await writeFile(path.join(localMediaDirectory, key), data);
}

export async function readSiteMedia(key: string) {
  if (process.env.NETLIFY === "true") {
    const result = await getMediaStore().get(key, { type: "arrayBuffer" });
    return new Uint8Array(result);
  }

  try {
    return await readFile(path.join(localMediaDirectory, key));
  } catch {
    return null;
  }
}
