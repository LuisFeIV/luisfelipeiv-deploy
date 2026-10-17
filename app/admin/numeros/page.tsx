import { AdminFrame, DemoNotice } from "../_components/admin-frame";
import { PublicNumberManager } from "../_components/public-number-manager";
import styles from "../admin.module.css";
import { mockPublicNumbers } from "@/lib/admin/mock-data";

export default function AdminNumbersPage() {
  return (
    <AdminFrame activeSection="numbers">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Contenido público</p>
          <h1 className={styles.adminTitle}>Números públicos</h1>
          <p className={styles.copy}>Edita únicamente las cifras que se muestran en la página pública.</p>
        </div>
      </header>
      <DemoNotice />
      <PublicNumberManager initialNumbers={mockPublicNumbers} />
    </AdminFrame>
  );
}
