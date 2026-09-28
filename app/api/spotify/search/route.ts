import { NextResponse } from "next/server";
import { z } from "zod";

import { searchSpotifyTracks } from "@/lib/spotify";

const searchQuerySchema = z.string().trim().min(2).max(100);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsedQuery = searchQuerySchema.safeParse(searchParams.get("q") ?? "");

  if (!parsedQuery.success) {
    return NextResponse.json({ tracks: [] });
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
