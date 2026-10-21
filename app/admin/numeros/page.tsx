import { AdminFrame } from "../_components/admin-frame";
import { PublicNumberManager } from "../_components/public-number-manager";
import styles from "../admin.module.css";
import { listAdminPublicNumbers } from "@/lib/db/site-content";

export const dynamic = "force-dynamic";

export default async function AdminNumbersPage() {
  const numbers = await listAdminPublicNumbers();
  return (
    <AdminFrame activeSection="numbers">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Contenido público</p>
          <h1 className={styles.adminTitle}>Números públicos</h1>
          <p className={styles.copy}>Edita únicamente las cifras que se muestran en la página pública.</p>
        </div>
      </header>
      <PublicNumberManager initialNumbers={numbers} />
    </AdminFrame>
  );
}
