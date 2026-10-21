import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { adminSessionCookieName, hasValidAdminSession } from "@/lib/admin-auth";

const requestSchema = z.object({ destinationUrl: z.string().trim().max(1000) });
const videoIdPattern = /^[A-Za-z0-9_-]{11}$/;
const oEmbedSchema = z.object({ title: z.string().optional(), thumbnail_url: z.string().optional() });

async function readOEmbed(endpoint: string) {
  try {
    const response = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!response.ok) return null;
    const parsed = oEmbedSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function cleanTitle(value: string | undefined) {
  const title = value?.replace(/\s+/g, " ").trim() ?? "";
  return title.length > 160 ? `${title.slice(0, 157).trimEnd()}…` : title;
}

function getYoutubeThumbnail(url: URL) {
  const host = url.hostname.replace(/^www\./, "");
  const videoId = host === "youtu.be"
    ? url.pathname.split("/").filter(Boolean)[0]
    : ["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)
      ? url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1]
      : null;

  return videoId && videoIdPattern.test(videoId)
    ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    : null;
}

function isInstagramVideo(url: URL) {
  const host = url.hostname.replace(/^www\./, "");
  return host === "instagram.com" && /^\/(?:reel|p|tv)\/[\w-]+\/?$/.test(url.pathname);
}

function isTikTokVideo(url: URL) {
  const host = url.hostname.replace(/^www\./, "");
  return host === "tiktok.com" && /^\/@[\w.-]+\/video\/\d+\/?$/.test(url.pathname);
}

function readMetaImage(markup: string) {
  for (const match of markup.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\b(?:property|name)\s*=\s*["'](?:og:image|twitter:image)["']/i.test(tag)) continue;
    const content = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1];
    if (content) return content.replace(/&amp;/g, "&").replace(/&#x26;/gi, "&");
  }
  return null;
}

function isTrustedThumbnail(value: string, provider: "instagram" | "tiktok") {
  try {
    const url = new URL(value);
    const domain = provider === "instagram" ? "cdninstagram.com" : "tiktokcdn.com";
    return url.protocol === "https:" && (url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!hasValidAdminSession(cookieStore.get(adminSessionCookieName)?.value)) {
    return NextResponse.json({ error: "Tu sesión terminó." }, { status: 401 });
  }

  let payload: z.infer<typeof requestSchema>;
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Pega un enlace público de video." }, { status: 400 });
    payload = parsed.data;
  } catch {
    return NextResponse.json({ error: "No pudimos leer el enlace." }, { status: 400 });
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(payload.destinationUrl);
  } catch {
    return NextResponse.json({ error: "Pega un enlace válido de video." }, { status: 400 });
  }
  if (sourceUrl.protocol !== "https:") {
    return NextResponse.json({ error: "El enlace del video debe usar HTTPS." }, { status: 400 });
  }

  const youtubeThumbnail = getYoutubeThumbnail(sourceUrl);
  if (youtubeThumbnail) {
    const oEmbed = await readOEmbed(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(sourceUrl.toString())}`);
    return NextResponse.json({ imageUrl: youtubeThumbnail, provider: "YouTube", title: cleanTitle(oEmbed?.title) });
  }

  const instagram = isInstagramVideo(sourceUrl);
  const tiktok = isTikTokVideo(sourceUrl);
  if (!instagram && !tiktok) {
    return NextResponse.json({ error: "Por ahora detectamos miniaturas públicas de YouTube, Instagram y TikTok." }, { status: 422 });
  }

  let oEmbedTitle = "";
  if (tiktok) {
    const oEmbed = await readOEmbed(`https://www.tiktok.com/oembed?url=${encodeURIComponent(`https://www.tiktok.com${sourceUrl.pathname}`)}`);
    if (oEmbed?.thumbnail_url && isTrustedThumbnail(oEmbed.thumbnail_url, "tiktok")) {
      return NextResponse.json({ imageUrl: oEmbed.thumbnail_url, provider: "TikTok", title: cleanTitle(oEmbed.title) }, { headers: { "Cache-Control": "no-store" } });
    }
    oEmbedTitle = cleanTitle(oEmbed?.title);
  }

  try {
    const pageUrl = instagram
      ? `https://www.instagram.com${sourceUrl.pathname}`
      : `https://www.tiktok.com${sourceUrl.pathname}`;
    const response = await fetch(pageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LuisFelipeIV/1.0)", Accept: "text/html" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok || new URL(response.url).hostname.split(".").slice(-2).join(".") !== (instagram ? "instagram.com" : "tiktok.com")) {
      return NextResponse.json({ error: "La plataforma no permitió leer la miniatura." }, { status: 404 });
    }
    const markup = await response.text();
    const thumbnail = readMetaImage(markup);
    const provider = instagram ? "instagram" : "tiktok";
    if (!thumbnail || !isTrustedThumbnail(thumbnail, provider)) {
      return NextResponse.json({ error: "No encontramos una miniatura pública." }, { status: 404 });
    }

    return NextResponse.json({ imageUrl: thumbnail, provider: instagram ? "Instagram" : "TikTok", title: oEmbedTitle }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No pudimos consultar la miniatura." }, { status: 502 });
  }
}
