import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import styles from "../admin.module.css";
import { adminSessionCookieName, hasValidAdminSession } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DedicationStatus } from "@/lib/supabase/database.types";
import { AdminFrame } from "../_components/admin-frame";

const statusFilterValues = [
  "all",
  "pending",
  "approved",
  "published",
  "rejected",
] as const;

const permissionFilterValues = ["all", "authorized"] as const;

type StatusFilter = (typeof statusFilterValues)[number];
type PermissionFilter = (typeof permissionFilterValues)[number];

const statusLabels: Record<DedicationStatus, string> = {
  approved: "Aprobada",
  pending: "Pendiente",
  published: "Publicada",
  rejected: "No publicada",
};

const filterLabels: Record<StatusFilter, string> = {
  all: "Todas",
  approved: "Aprobadas",
  pending: "Pendientes",
  published: "Publicadas",
  rejected: "No publicadas",
};

type AdminDedicationsPageProps = {
  searchParams: Promise<{
    error?: string;
    permission?: string;
    status?: string;
    updated?: string;
  }>;
};

function getStatusFilter(value: string | undefined): StatusFilter {
  if (statusFilterValues.some((filter) => filter === value)) {
    return value as StatusFilter;
  }

  return "all";
}

function getPermissionFilter(value: string | undefined): PermissionFilter {
  if (permissionFilterValues.some((filter) => filter === value)) {
    return value as PermissionFilter;
  }

  return "all";
}

function getFilterUrl(status: StatusFilter, permission: PermissionFilter) {
  const searchParams = new URLSearchParams();

  if (status !== "all") {
    searchParams.set("status", status);
  }

  if (permission !== "all") {
    searchParams.set("permission", permission);
  }

  const query = searchParams.toString();

  return query ? `/admin/dedicatorias?${query}` : "/admin/dedicatorias";
}

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

async function getDedications(
  statusFilter: StatusFilter,
  permissionFilter: PermissionFilter,
) {
  try {
    const supabase = createSupabaseServerClient();
    let query = supabase
      .from("dedications")
      .select(
        "id, sender_name, recipient_name, song, artist, message, instagram, allow_publishing, status, created_at",
      );

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (permissionFilter === "authorized") {
      query = query.eq("allow_publishing", true);
    }

    const { data, error } = await query
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

export default async function AdminDedicationsPage({
  searchParams,
}: AdminDedicationsPageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;

  if (!(await hasValidAdminSession(token))) {
    redirect("/admin/login");
  }

  const parameters = await searchParams;
  const statusFilter = getStatusFilter(parameters.status);
  const permissionFilter = getPermissionFilter(parameters.permission);
  const { dedications, hasError } = await getDedications(
    statusFilter,
    permissionFilter,
  );
  const hasActiveFilters =
    statusFilter !== "all" || permissionFilter !== "all";

  return (
    <AdminFrame activeSection="dedications">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Buzón privado · datos reales</p>
          <h1 className={styles.adminTitle} id="admin-dedications-title">
            Dedicatorias
          </h1>
          <p className={styles.copy}>
            {dedications.length} historia{dedications.length === 1 ? "" : "s"} ·
            mostrando hasta 100, de la más nueva a la más antigua.
          </p>
        </div>
      </header>

      <nav aria-label="Filtros de dedicatorias" className={styles.filters}>
        <div className={styles.filterGroup}>
          <p className={styles.filterLabel}>Estado</p>
          <div className={styles.filterOptions}>
            {statusFilterValues.map((filter) => (
              <a
                aria-current={statusFilter === filter ? "page" : undefined}
                className={
                  statusFilter === filter
                    ? `${styles.filterLink} ${styles.filterLinkActive}`
                    : styles.filterLink
                }
                href={getFilterUrl(filter, permissionFilter)}
                key={filter}
              >
                {filterLabels[filter]}
              </a>
            ))}
          </div>
        </div>
        <div className={styles.filterGroup}>
          <p className={styles.filterLabel}>Autorización</p>
          <div className={styles.filterOptions}>
            <a
              aria-current={permissionFilter === "all" ? "page" : undefined}
              className={
                permissionFilter === "all"
                  ? `${styles.filterLink} ${styles.filterLinkActive}`
                  : styles.filterLink
              }
              href={getFilterUrl(statusFilter, "all")}
            >
              Todas
            </a>
            <a
              aria-current={
                permissionFilter === "authorized" ? "page" : undefined
              }
              className={
                permissionFilter === "authorized"
                  ? `${styles.filterLink} ${styles.filterLinkActive}`
                  : styles.filterLink
              }
              href={getFilterUrl(statusFilter, "authorized")}
            >
              Con permiso para contenido
            </a>
          </div>
        </div>
      </nav>

      {parameters.error ? (
        <section className={styles.errorState} role="alert">
          <h2>No pudimos actualizar el estado.</h2>
          <p>Actualiza la página e inténtalo de nuevo.</p>
        </section>
      ) : null}

      {hasError ? (
        <section className={styles.errorState} role="alert">
          <h2>No pudimos cargar las dedicatorias.</h2>
          <p>Actualiza la página. Si continúa, revisa la conexión con Supabase.</p>
        </section>
      ) : null}

      {!hasError && dedications.length === 0 ? (
        <section className={styles.emptyState}>
          <h2>
            {hasActiveFilters
              ? "No hay historias con estos filtros."
              : "Aún no hay dedicatorias."}
          </h2>
          <p>
            {hasActiveFilters
              ? "Ajusta los filtros para ver otras historias."
              : "Cuando alguien comparta una historia desde el sitio, aparecerá aquí."}
          </p>
          {hasActiveFilters ? (
            <a className={styles.resetFilters} href="/admin/dedicatorias">
              Ver todas las dedicatorias
            </a>
          ) : null}
        </section>
      ) : null}

      {!hasError && dedications.length > 0 ? (
        <section
          aria-labelledby="admin-dedications-title"
          className={styles.dedicationList}
        >
          {dedications.map((dedication) => (
            <details
              className={styles.dedicationCard}
              id={`dedication-${dedication.id}`}
              key={dedication.id}
            >
              <summary className={styles.dedicationSummary}>
                <span className={styles.dedicationSummaryMain}>
                  <span className={styles.date}>{formatDate(dedication.created_at)}</span>
                  <strong>{dedication.song} <em>— {dedication.artist}</em></strong>
                  <small>De {dedication.sender_name ?? "Anónimo"} · para {dedication.recipient_name ?? "alguien especial"}</small>
                </span>
                <span className={styles.dedicationSummaryMeta}>
                  <span className={styles.statusBadge} data-status={dedication.status}>
                    {statusLabels[dedication.status]}
                  </span>
                  <span>{dedication.allow_publishing ? "Con permiso" : "Privada"}</span>
                </span>
              </summary>
              <div className={styles.dedicationDetail}>
                {parameters.updated === dedication.id ? (
                  <p className={styles.updatedMessage} role="status">
                    Estado actualizado correctamente.
                  </p>
                ) : null}
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
                        <a href={getInstagramUrl(dedication.instagram)} rel="noreferrer" target="_blank">
                          {dedication.instagram}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <div className={styles.moderationRow}>
                  <p>Cambiar estado</p>
                  <div className={styles.moderationActions}>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <form action="/api/admin/dedications/update" key={value} method="post">
                        <input name="id" type="hidden" value={dedication.id} />
                        <input name="filterStatus" type="hidden" value={statusFilter} />
                        <input name="filterPermission" type="hidden" value={permissionFilter} />
                        <input name="status" type="hidden" value={value} />
                        <button
                          className={dedication.status === value ? `${styles.moderationButton} ${styles.moderationButtonActive}` : styles.moderationButton}
                          disabled={dedication.status === value}
                          type="submit"
                        >
                          {label}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          ))}
        </section>
      ) : null}
    </AdminFrame>
  );
}
