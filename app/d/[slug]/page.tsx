import { createHash } from "node:crypto";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import styles from "./page.module.css";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PrivateDedicationPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getShareToken(slug: string) {
  const separatorIndex = slug.lastIndexOf("--");

  if (separatorIndex === -1) {
    return null;
  }

  const token = slug.slice(separatorIndex + 2);

  return /^[A-Za-z0-9_-]{16}$/.test(token) ? token : null;
}

function hashShareToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

const getPrivateDedication = cache(async (slug: string) => {
  const token = getShareToken(slug);

  if (!token) {
    return null;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("private_dedications")
      .select("sender_name, recipient_name, song, artist, message")
      .eq("share_token_hash", hashShareToken(token))
      .maybeSingle();

    if (error) {
      console.error("Unable to load private dedication.", error);

      return null;
    }

    return data;
  } catch (error) {
    console.error("Unable to initialize Supabase.", error);

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
    <main className={styles.page}>
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
