import { randomUUID } from "node:crypto";

import { desc } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminSessionCookieName, hasValidAdminSession } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/db/client";
import { siteMediaAssets } from "@/lib/db/schema";
import { readSiteMedia, saveSiteMedia } from "@/lib/site-media-storage";

const maximumUploadBytes = 4 * 1024 * 1024;

async function isAdmin() {
  const cookieStore = await cookies();
  return hasValidAdminSession(cookieStore.get(adminSessionCookieName)?.value);
}

function getImageType(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Tu sesión terminó." }, { status: 401 });
  }

  const assets = await getDatabase()
    .select({ id: siteMediaAssets.id, name: siteMediaAssets.original_name, contentType: siteMediaAssets.content_type, sizeBytes: siteMediaAssets.size_bytes, width: siteMediaAssets.width, height: siteMediaAssets.height })
    .from(siteMediaAssets)
    .orderBy(desc(siteMediaAssets.created_at))
    .limit(100);

  return NextResponse.json({ assets: assets.map((asset) => ({ ...asset, url: `/api/media/${asset.id}` })) });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Tu sesión terminó." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "No pudimos leer el archivo." }, { status: 400 });
  }

  const file = formData.get("file");
  const widthValue = Number(formData.get("width"));
  const heightValue = Number(formData.get("height"));

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Elige una imagen para continuar." }, { status: 400 });
  }
  if (file.size > maximumUploadBytes) {
    return NextResponse.json({ error: "La imagen debe pesar menos de 4 MB." }, { status: 413 });
  }
  if (!Number.isInteger(widthValue) || !Number.isInteger(heightValue) || Math.max(widthValue, heightValue) < 900 || Math.min(widthValue, heightValue) < 600 || widthValue > 4096 || heightValue > 4096) {
    return NextResponse.json({ error: "Usa una imagen con 900 px en su lado largo y 600 px en el corto para que se vea nítida." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = getImageType(bytes);
  if (!contentType || contentType !== file.type) {
    return NextResponse.json({ error: "Formato no compatible. Usa JPEG, PNG o WebP." }, { status: 415 });
  }

  const id = randomUUID();
  const storageKey = id;

  try {
    await saveSiteMedia(storageKey, bytes);
    const [asset] = await getDatabase()
      .insert(siteMediaAssets)
      .values({ id, storage_key: storageKey, original_name: file.name.slice(0, 160), content_type: contentType, size_bytes: file.size, width: widthValue, height: heightValue })
      .returning({ id: siteMediaAssets.id });

    return NextResponse.json({ asset: { id: asset.id, name: file.name, url: `/api/media/${asset.id}`, width: widthValue, height: heightValue } }, { status: 201 });
  } catch (error) {
    console.error("Unable to save site media.", error);
    return NextResponse.json({ error: "No pudimos guardar la imagen. Inténtalo de nuevo." }, { status: 500 });
  }
}
