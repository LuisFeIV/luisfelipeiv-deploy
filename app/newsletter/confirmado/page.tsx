import type { Metadata } from "next";

import styles from "./page.module.css";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Suscripción confirmada | Luis Felipe IV",
};

export default function NewsletterConfirmedPage() {
  return (
    <main className={styles.page}>
      <article className={styles.card}>
        <header className={styles.header}>
          <p className={styles.brand}>
            Luis<span>·</span>Felipe IV
          </p>
          <span aria-hidden="true" className={styles.mark}>
            ♪
          </span>
        </header>
        <div className={styles.content}>
          <p className={styles.eyebrow}>Newsletter</p>
          <h1 className={styles.title}>
            Ya estás <em>dentro.</em>
          </h1>
          <p className={styles.copy}>
            Tu suscripción quedó confirmada. Pronto recibirás historias detrás de las
            canciones que vale la pena escuchar.
          </p>
          <div className={styles.actions}>
            <a className={styles.primaryAction} href="/">
              Volver al sitio
            </a>
            <a className={styles.secondaryAction} href="/#buzon">
              Contar mi historia
            </a>
          </div>
          <p className={styles.note}>Una vez a la semana. Sin spam.</p>
        </div>
      </article>
    </main>
  );
}
