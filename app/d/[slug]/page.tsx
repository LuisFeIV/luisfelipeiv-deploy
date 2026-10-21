import { createHash } from "node:crypto";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import styles from "./page.module.css";
import { findPrivateDedication } from "@/lib/db/dedications";
import { parsePrivateDedicationSlug } from "@/lib/private-dedication-slug";

type PrivateDedicationPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function hashShareToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

const getPrivateDedication = cache(async (slug: string) => {
  const parsedSlug = parsePrivateDedicationSlug(slug);

  if (!parsedSlug) {
    return null;
  }

  try {
    const dedication = await findPrivateDedication(
      hashShareToken(parsedSlug.shareToken),
    );

    if (!dedication) {
      return null;
    }

    return {
      ...dedication,
      story_style: parsedSlug.storyStyle ?? dedication.story_style,
    };
  } catch (error) {
    console.error("Unable to load private dedication.", error);

    return null;
  }
});

export async function generateMetadata({
  params,
}: PrivateDedicationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const dedication = await getPrivateDedication(slug);

  if (!dedication) {
    return {
      robots: {
        follow: false,
        index: false,
      },
      title: "Dedicatoria no encontrada | Luis Felipe IV",
    };
  }

  return {
    description: "Abre una dedicatoria musical privada de Luis Felipe IV.",
    openGraph: {
      description: "Abre una dedicatoria musical privada.",
      title: "Tienes una canción dedicada",
    },
    robots: {
      follow: false,
      index: false,
    },
    title: "Tienes una canción dedicada | Luis Felipe IV",
  };
}

export default async function PrivateDedicationPage({
  params,
}: PrivateDedicationPageProps) {
  const { slug } = await params;
  const dedication = await getPrivateDedication(slug);

  if (!dedication) {
    notFound();
  }

  return (
    <main className={styles.page} data-story-style={dedication.story_style}>
      <article className={styles.card}>
        <header className={styles.top}>
          <p className={styles.brand}>
            Luis<span>·</span>Felipe IV
          </p>
          <span aria-hidden="true" className={styles.mark}>
            ♪
          </span>
        </header>
        <div className={styles.body}>
          <p className={styles.eyebrow}>Una canción para</p>
          <h1 className={styles.title}>
            <span>{dedication.recipient_name}</span>
          </h1>
          <h2 className={styles.song}>{dedication.song}</h2>
          <p className={styles.artist}>{dedication.artist}</p>
          {dedication.spotify_track_id ? (
            <iframe
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              className={styles.spotifyPlayer}
              loading="lazy"
              src={`https://open.spotify.com/embed/track/${dedication.spotify_track_id}?utm_source=luisfelipeiv`}
              title={`Escuchar ${dedication.song} en Spotify`}
            />
          ) : null}
          <p className={styles.message}>{dedication.message}</p>
          <p className={styles.sender}>
            De parte de{" "}
            <strong>{dedication.sender_name ?? "alguien que piensa en ti"}</strong>
          </p>
          <p className={styles.privacy}>
            Esta dedicatoria fue compartida de forma privada.
          </p>
        </div>
      </article>
    </main>
  );
}
