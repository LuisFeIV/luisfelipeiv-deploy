import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDatabase } from "@/lib/db/client";
import { siteMediaAssets } from "@/lib/db/schema";
import { readSiteMedia } from "@/lib/site-media-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return new NextResponse(null, { status: 404 });
  }
  const [asset] = await getDatabase()
    .select({ key: siteMediaAssets.storage_key, contentType: siteMediaAssets.content_type })
    .from(siteMediaAssets)
    .where(eq(siteMediaAssets.id, id))
    .limit(1);

  if (!asset) return new NextResponse(null, { status: 404 });

  const image = await readSiteMedia(asset.key);
  if (!image) return new NextResponse(null, { status: 404 });

  const body = new Uint8Array(image.byteLength);
  body.set(image);
  return new NextResponse(body, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(image.byteLength),
      "Content-Type": asset.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
