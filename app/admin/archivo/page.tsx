import { AdminFrame, DemoNotice } from "../_components/admin-frame";
import { ArchiveManager } from "../_components/archive-manager";
import styles from "../admin.module.css";
import { mockArchiveItems } from "@/lib/admin/mock-data";

export default function AdminArchivePage() {
  return (
    <AdminFrame activeSection="archive">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Contenido destacado</p>
          <h1 className={styles.adminTitle}>El Archivo</h1>
          <p className={styles.copy}>Organiza los videos y episodios destacados del carrusel público.</p>
        </div>
      </header>
      <DemoNotice />
      <ArchiveManager initialItems={mockArchiveItems} />
    </AdminFrame>
  );
}
