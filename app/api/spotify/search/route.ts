import { NextResponse } from "next/server";
import { z } from "zod";

import { isRateLimited } from "@/lib/rate-limit";
import { searchSpotifyTracks } from "@/lib/spotify";

const searchQuerySchema = z.string().trim().min(2).max(100);

function getClientIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsedQuery = searchQuerySchema.safeParse(searchParams.get("q") ?? "");

  if (!parsedQuery.success) {
    return NextResponse.json({ tracks: [] });
  }

  if (isRateLimited(`spotify-search:${getClientIdentifier(request)}`, 30, 60_000)) {
    return NextResponse.json(
      { error: "Espera un momento antes de buscar otra vez." },
      { status: 429 },
    );
  }

  try {
    const result = await searchSpotifyTracks(parsedQuery.data);

    if (!result.configured) {
      return NextResponse.json(
        { error: "La búsqueda musical aún no está disponible." },
        { status: 503 },
      );
    }

    return NextResponse.json({ tracks: result.tracks });
  } catch (error) {
    console.error("Unable to search Spotify tracks.", error);

    return NextResponse.json(
      { error: "No pudimos buscar canciones por ahora." },
      { status: 502 },
    );
  }
}
