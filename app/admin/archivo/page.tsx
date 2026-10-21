import { AdminFrame } from "../_components/admin-frame";
import { ArchiveManager } from "../_components/archive-manager";
import styles from "../admin.module.css";
import { listAdminArchiveItems } from "@/lib/db/site-content";

export const dynamic = "force-dynamic";

export default async function AdminArchivePage() {
  const items = await listAdminArchiveItems();
  return (
    <AdminFrame activeSection="archive">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Contenido destacado</p>
          <h1 className={styles.adminTitle}>El Archivo</h1>
          <p className={styles.copy}>Organiza los videos y episodios destacados del carrusel público.</p>
        </div>
      </header>
      <ArchiveManager initialItems={items} />
    </AdminFrame>
  );
}
