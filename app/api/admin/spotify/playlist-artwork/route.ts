import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { adminSessionCookieName, hasValidAdminSession } from "@/lib/admin-auth";
import { getSpotifyPlaylistDetails } from "@/lib/spotify";

const allowedImageHosts = new Set(["i.scdn.co", "image-cdn-ak.spotifycdn.com"]);
const playlistArtworkRequestSchema = z.object({ spotifyUrl: z.string().max(500) });
const spotifyOEmbedSchema = z.object({
  provider_name: z.literal("Spotify"),
  thumbnail_url: z.string().url().optional(),
  title: z.string().optional(),
});

function readAllowedImage(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedImageHosts.has(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!hasValidAdminSession(cookieStore.get(adminSessionCookieName)?.value)) {
    return NextResponse.json({ error: "Tu sesión terminó." }, { status: 401 });
  }

  let spotifyUrl: string;
  try {
    const parsedBody = playlistArtworkRequestSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Pega un enlace de playlist de Spotify." }, { status: 400 });
    }
    spotifyUrl = parsedBody.data.spotifyUrl;
  } catch {
    return NextResponse.json({ error: "No pudimos leer el enlace." }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(spotifyUrl);
  } catch {
    return NextResponse.json({ error: "Pega un enlace válido de playlist de Spotify." }, { status: 400 });
  }

  const segments = parsedUrl.pathname.split("/").filter(Boolean);
  const playlistIndex = segments.indexOf("playlist");
  const playlistId = playlistIndex >= 0 ? segments[playlistIndex + 1] : undefined;
  if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "open.spotify.com" || !playlistId || !/^[A-Za-z0-9]{22}$/.test(playlistId)) {
    return NextResponse.json({ error: "El enlace debe ser de una playlist pública de Spotify." }, { status: 400 });
  }

  const canonicalUrl = `https://open.spotify.com/playlist/${playlistId}`;
  const [oEmbed, details] = await Promise.all([
    fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(canonicalUrl)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    })
      .then(async (response) => response.ok ? spotifyOEmbedSchema.safeParse(await response.json()) : null)
      .then((parsed) => parsed?.success ? parsed.data : null)
      .catch(() => null),
    getSpotifyPlaylistDetails(playlistId).catch(() => null),
  ]);

  const title = details?.title || oEmbed?.title?.trim() || "";
  const description = details?.description ?? "";
  const imageUrl = readAllowedImage(oEmbed?.thumbnail_url) ?? readAllowedImage(details?.imageUrl);
  if (!title && !imageUrl) {
    return NextResponse.json({ error: "Spotify no devolvió datos de esa playlist. Revisa que sea pública." }, { status: 404 });
  }

  return NextResponse.json({ description, imageUrl, title }, { headers: { "Cache-Control": "no-store" } });
}
