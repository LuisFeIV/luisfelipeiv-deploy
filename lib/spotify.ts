import { z } from "zod";

const spotifyAccessTokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
});

const spotifySearchResponseSchema = z.object({
  tracks: z.object({
    items: z.array(
      z.object({
        artists: z.array(z.object({ name: z.string().min(1) })).min(1),
        external_urls: z.object({ spotify: z.url() }),
        id: z.string().min(1).max(64),
        name: z.string().min(1).max(160),
      }),
    ),
  }),
});

type SpotifyAccessToken = {
  expiresAt: number;
  value: string;
};

export type SpotifyTrack = {
  artists: string;
  id: string;
  name: string;
  url: string;
};

let cachedAccessToken: SpotifyAccessToken | null = null;

function getSpotifyCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret };
}

async function getSpotifyAccessToken() {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
    return cachedAccessToken.value;
  }

  const credentials = getSpotifyCredentials();

  if (!credentials) {
    return null;
  }

  const authorization = Buffer.from(
    `${credentials.clientId}:${credentials.clientSecret}`,
  ).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    body: "grant_type=client_credentials",
    cache: "no-store",
    headers: {
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (!response.ok) {
    return null;
  }

  const parsedToken = spotifyAccessTokenSchema.safeParse(await response.json());

  if (!parsedToken.success) {
    return null;
  }

  cachedAccessToken = {
    expiresAt: Date.now() + (parsedToken.data.expires_in - 60) * 1000,
    value: parsedToken.data.access_token,
  };

  return cachedAccessToken.value;
}

export async function searchSpotifyTracks(query: string) {
  const accessToken = await getSpotifyAccessToken();

  if (!accessToken) {
    return { configured: Boolean(getSpotifyCredentials()), tracks: [] };
  }

  const parameters = new URLSearchParams({
    limit: "6",
    market: "MX",
    q: query,
    type: "track",
  });
  const response = await fetch(`https://api.spotify.com/v1/search?${parameters}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return { configured: true, tracks: [] };
  }

  const parsedResults = spotifySearchResponseSchema.safeParse(
    await response.json(),
  );

  if (!parsedResults.success) {
    return { configured: true, tracks: [] };
  }

  const tracks = parsedResults.data.tracks.items.map((track) => ({
    artists: track.artists.map((artist) => artist.name).join(", "),
    id: track.id,
    name: track.name,
    url: track.external_urls.spotify,
  }));

  return { configured: true, tracks };
}
