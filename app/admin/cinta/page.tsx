import { AdminFrame } from "../_components/admin-frame";
import { RibbonManager } from "../_components/ribbon-manager";
import styles from "../admin.module.css";
import { listAdminRibbonItems } from "@/lib/db/site-content";

export const dynamic = "force-dynamic";

export default async function AdminRibbonPage() {
  const items = await listAdminRibbonItems();
  return (
    <AdminFrame activeSection="ribbon">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Inicio del sitio</p>
          <h1 className={styles.adminTitle}>Cinta</h1>
          <p className={styles.copy}>Elige qué artistas, canciones y frases recorren la cinta roja y en qué orden. El movimiento y el diseño se mantienen igual.</p>
        </div>
      </header>
      <RibbonManager initialItems={items} />
    </AdminFrame>
  );
}
