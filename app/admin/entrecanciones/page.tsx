import { AdminFrame } from "../_components/admin-frame";
import { CommunityStoryManager } from "../_components/community-story-manager";
import styles from "../admin.module.css";
import { listAdminCommunityStories } from "@/lib/db/site-content";

export const dynamic = "force-dynamic";

export default async function AdminCommunityStoriesPage() {
  const stories = await listAdminCommunityStories();
  return (
    <AdminFrame activeSection="stories">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Historias de la comunidad</p>
          <h1 className={styles.adminTitle}>Entrecanciones</h1>
          <p className={styles.copy}>Selecciona, ordena y previsualiza las historias que forman el muro público.</p>
        </div>
      </header>
      <CommunityStoryManager initialStories={stories} />
    </AdminFrame>
  );
}
