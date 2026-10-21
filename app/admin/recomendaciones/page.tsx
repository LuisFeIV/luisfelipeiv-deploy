import { AdminFrame } from "../_components/admin-frame";
import { RecommendationManager } from "../_components/recommendation-manager";
import styles from "../admin.module.css";
import { listAdminPlaylists, listAdminRecommendations } from "@/lib/db/site-content";

export const dynamic = "force-dynamic";

export default async function AdminRecommendationsPage() {
  const [recommendations, playlists] = await Promise.all([listAdminRecommendations(), listAdminPlaylists()]);
  return (
    <AdminFrame activeSection="recommendations">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Formulario de dedicatorias</p>
          <h1 className={styles.adminTitle}>Recomendaciones</h1>
          <p className={styles.copy}>Elige las tres canciones que sugerimos en «¿No sabes cuál dedicar?» y el mood al que corresponde cada una.</p>
        </div>
      </header>
      <RecommendationManager initialRecommendations={recommendations} playlists={playlists} />
    </AdminFrame>
  );
}
