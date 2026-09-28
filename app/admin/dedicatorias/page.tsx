import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import styles from "../admin.module.css";
import { adminSessionCookieName, hasValidAdminSession } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DedicationStatus } from "@/lib/supabase/database.types";

const statusLabels: Record<DedicationStatus, string> = {
  approved: "Aprobada",
  pending: "Pendiente",
  published: "Publicada",
  rejected: "No publicada",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date(value));
}

function getInstagramUrl(value: string) {
  return `https://www.instagram.com/${value.replace(/^@/, "")}`;
}

async function getDedications() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("dedications")
      .select(
        "id, sender_name, recipient_name, song, artist, message, instagram, allow_publishing, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Unable to load dedications.", error);

      return { dedications: [], hasError: true };
    }

    return { dedications: data, hasError: false };
  } catch (error) {
    console.error("Unable to initialize Supabase.", error);

    return { dedications: [], hasError: true };
  }
}

export default async function AdminDedicationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;

  if (!(await hasValidAdminSession(token))) {
    redirect("/admin/login");
  }

  const { dedications, hasError } = await getDedications();

  return (
    <main className={styles.adminShell}>
      <header className={styles.adminHeader}>
        <div>
          <p className={styles.eyebrow}>Luis Felipe IV · acceso protegido</p>
          <h1 className={styles.adminTitle} id="admin-dedications-title">
            Dedicatorias recibidas
          </h1>
          <p className={styles.copy}>
            Las 100 historias más recientes, ordenadas de la más nueva a la más
            antigua.
          </p>
        </div>
        <form action="/api/admin/logout" method="post">
          <button className={styles.logoutButton} type="submit">
            Cerrar sesión
          </button>
        </form>
      </header>

      {hasError ? (
        <section className={styles.errorState} role="alert">
          <h2>No pudimos cargar las dedicatorias.</h2>
          <p>Actualiza la página. Si continúa, revisa la conexión con Supabase.</p>
        </section>
      ) : null}

      {!hasError && dedications.length === 0 ? (
        <section className={styles.emptyState}>
          <h2>Aún no hay dedicatorias.</h2>
          <p>Cuando alguien comparta una historia desde el sitio, aparecerá aquí.</p>
        </section>
      ) : null}

      {!hasError && dedications.length > 0 ? (
        <section
          aria-labelledby="admin-dedications-title"
          className={styles.dedicationList}
        >
          {dedications.map((dedication) => (
            <article className={styles.dedicationCard} key={dedication.id}>
              <div className={styles.cardHeader}>
                <p className={styles.date}>{formatDate(dedication.created_at)}</p>
                <p className={styles.status}>{statusLabels[dedication.status]}</p>
              </div>
              <h2 className={styles.song}>
                {dedication.song} <span>— {dedication.artist}</span>
              </h2>
              <p className={styles.message}>{dedication.message}</p>
              <dl className={styles.details}>
                <div>
                  <dt>Envió</dt>
                  <dd>{dedication.sender_name ?? "Anónimo"}</dd>
                </div>
                <div>
                  <dt>Dedicada a</dt>
                  <dd>{dedication.recipient_name ?? "No especificado"}</dd>
                </div>
                <div>
                  <dt>Uso en contenido</dt>
                  <dd>{dedication.allow_publishing ? "Autorizado" : "No autorizado"}</dd>
                </div>
                {dedication.instagram ? (
                  <div>
                    <dt>Instagram</dt>
                    <dd>
                      <a
                        href={getInstagramUrl(dedication.instagram)}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {dedication.instagram}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  );
}
