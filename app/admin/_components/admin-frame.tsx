import Link from "next/link";
import type { ReactNode } from "react";

import styles from "../admin.module.css";

type AdminSection = "archive" | "dedications" | "numbers" | "playlists" | "stories";

type AdminFrameProps = {
  activeSection: AdminSection;
  children: ReactNode;
};

const navigationItems: Array<{
  href: string;
  label: string;
  section: AdminSection;
}> = [
  { href: "/admin/dedicatorias", label: "Dedicatorias", section: "dedications" },
  { href: "/admin/archivo", label: "El Archivo", section: "archive" },
  { href: "/admin/playlists", label: "Playlists", section: "playlists" },
  { href: "/admin/entrecanciones", label: "Entrecanciones", section: "stories" },
  { href: "/admin/numeros", label: "Números públicos", section: "numbers" },
];

export function AdminFrame({ activeSection, children }: AdminFrameProps) {
  return (
    <div className={styles.adminWorkspace}>
      <a className={styles.skipLink} href="#admin-content">
        Saltar al contenido
      </a>
      <header className={styles.workspaceHeader}>
        <Link aria-label="Inicio del panel de Luis Felipe IV" className={styles.adminBrand} href="/admin/dedicatorias">
          Luis<span>·</span>Felipe IV
          <small>Panel editorial</small>
        </Link>
        <nav aria-label="Secciones del panel" className={styles.adminNavigation}>
          {navigationItems.map((item) => (
            <Link
              aria-current={activeSection === item.section ? "page" : undefined}
              className={
                activeSection === item.section
                  ? `${styles.adminNavigationLink} ${styles.adminNavigationLinkActive}`
                  : styles.adminNavigationLink
              }
              href={item.href}
              key={item.section}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/api/admin/logout" method="post">
          <button className={styles.logoutButton} type="submit">
            Cerrar sesión
          </button>
        </form>
      </header>
      <main className={styles.adminShell} id="admin-content">
        {children}
      </main>
    </div>
  );
}

export function DemoNotice() {
  return (
    <aside className={styles.demoNotice} role="note">
      <span aria-hidden="true" className={styles.demoNoticeMark}>D</span>
      <div>
        <strong>Modo demostración</strong>
        <p>Los cambios funcionan sólo en esta sesión y se pierden al recargar. Todavía no se guardan en una base de datos.</p>
      </div>
    </aside>
  );
}
