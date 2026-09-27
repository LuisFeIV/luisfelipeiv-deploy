import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import styles from "../admin.module.css";
import { adminSessionCookieName, hasValidAdminSession } from "@/lib/admin-auth";

export default async function AdminDedicationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;

  if (!(await hasValidAdminSession(token))) {
    redirect("/admin/login");
  }

  return (
    <main className={styles.shell}>
      <section aria-labelledby="admin-dedications-title" className={styles.panel}>
        <p className={styles.eyebrow}>Acceso protegido</p>
        <h1 className={styles.title} id="admin-dedications-title">
          Dedicatorias
        </h1>
        <p className={styles.copy}>
          La vista interna para consultar las historias recibidas se agregará a
          continuación.
        </p>
        <form action="/api/admin/logout" className={styles.actions} method="post">
          <button className={styles.logoutButton} type="submit">
            Cerrar sesión
          </button>
        </form>
      </section>
    </main>
  );
}
