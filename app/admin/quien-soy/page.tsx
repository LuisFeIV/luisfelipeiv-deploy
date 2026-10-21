import { AdminFrame } from "../_components/admin-frame";
import { AboutImagesManager } from "../_components/about-images-manager";
import styles from "../admin.module.css";
import { listAdminAboutImages } from "@/lib/db/site-content";

export const dynamic = "force-dynamic";

export default async function AdminAboutImagesPage() {
  const images = await listAdminAboutImages();
  return <AdminFrame activeSection="about-images">
    <header className={styles.pageHeader}><div><p className={styles.eyebrow}>Presentación</p><h1 className={styles.adminTitle}>Quién soy</h1><p className={styles.copy}>Sube fotos nítidas, ordénalas y decide cuáles aparecen en el carrusel.</p></div></header>
    <AboutImagesManager initialImages={images} />
  </AdminFrame>;
}
