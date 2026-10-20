import { createHash, randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { createPrivateDedication } from "@/lib/db/dedications";
import { privateDedicationSubmissionSchema } from "@/lib/validations/dedication";

const PRODUCTION_PUBLIC_ORIGIN = "https://www.luisfelipeiv.com";

function createShareToken() {
  return randomBytes(12).toString("base64url");
}

function hashShareToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createFriendlySlug(recipientName: string) {
  const normalizedName = recipientName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return normalizedName ? `para-${normalizedName}` : "una-cancion";
}

function getPublicOrigin(request: Request) {
  const configuredOrigin = process.env.PUBLIC_SITE_URL?.trim();

  if (configuredOrigin) {
    return new URL(configuredOrigin).origin;
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_PUBLIC_ORIGIN;
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "La solicitud no tiene un formato válido." },
      { status: 400 },
    );
  }

  const parsed = privateDedicationSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Revisa los datos de tu dedicatoria.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { website, ...dedication } = parsed.data;

  if (website) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  const shareToken = createShareToken();
  const sharePath = `/d/${createFriendlySlug(dedication.recipientName)}--${dedication.storyStyle}--${shareToken}`;
  const shareUrl = new URL(sharePath, getPublicOrigin(request)).toString();

  try {
    await createPrivateDedication({
      artist: dedication.artist,
      message: dedication.message,
      recipient_name: dedication.recipientName,
      sender_name: dedication.senderName ?? null,
      share_token_hash: hashShareToken(shareToken),
      song: dedication.song,
      spotify_track_id: dedication.spotifyTrackId ?? null,
      spotify_url: dedication.spotifyUrl ?? null,
      story_style: dedication.storyStyle,
    });
  } catch (error) {
    console.error("Unable to save private dedication.", error);

    return NextResponse.json(
      { error: "No pudimos crear tu dedicatoria. Inténtalo de nuevo." },
      { status: 500 },
    );
  }

  return NextResponse.json({ sharePath, shareUrl, success: true }, { status: 201 });
}
