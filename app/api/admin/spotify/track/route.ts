import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { adminSessionCookieName, hasValidAdminSession } from "@/lib/admin-auth";
import { getSpotifyTrack, searchSpotifyTracks } from "@/lib/spotify";

const requestSchema = z.object({ query: z.string().trim().min(2).max(500) });

function readTrackId(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "open.spotify.com") return null;
    const segments = url.pathname.split("/").filter(Boolean);
    const trackIndex = segments.indexOf("track");
    const trackId = trackIndex >= 0 ? segments[trackIndex + 1] : undefined;
    return trackId && /^[A-Za-z0-9]{22}$/.test(trackId) ? trackId : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!hasValidAdminSession(cookieStore.get(adminSessionCookieName)?.value)) {
    return NextResponse.json({ error: "Tu sesión terminó. Inicia sesión de nuevo." }, { status: 401 });
  }

  let query: string;
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Escribe al menos dos letras o pega un enlace de canción." }, { status: 400 });
    query = parsed.data.query;
  } catch {
    return NextResponse.json({ error: "No pudimos leer la búsqueda." }, { status: 400 });
  }

  const looksLikeUrl = /^https?:\/\//i.test(query);
  const trackId = readTrackId(query);
  if (looksLikeUrl && !trackId) {
    return NextResponse.json({ error: "El enlace debe ser de una canción de Spotify (open.spotify.com/track/…)." }, { status: 400 });
  }

  try {
    if (trackId) {
      const track = await getSpotifyTrack(trackId);
      if (!track) return NextResponse.json({ error: "Spotify no devolvió esa canción. Revisa el enlace o búscala por nombre." }, { status: 404 });
      return NextResponse.json({ tracks: [track] }, { headers: { "Cache-Control": "no-store" } });
    }

    const result = await searchSpotifyTracks(query);
    if (!result.configured) return NextResponse.json({ error: "La conexión con Spotify no está configurada." }, { status: 503 });
    return NextResponse.json({ tracks: result.tracks }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to read Spotify track.", error);
    return NextResponse.json({ error: "No pudimos consultar Spotify. Inténtalo de nuevo en un momento." }, { status: 502 });
  }
}
