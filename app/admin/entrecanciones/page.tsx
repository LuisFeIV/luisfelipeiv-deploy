import { AdminFrame, DemoNotice } from "../_components/admin-frame";
import { CommunityStoryManager } from "../_components/community-story-manager";
import styles from "../admin.module.css";
import { mockCommunityStories } from "@/lib/admin/mock-data";

export default function AdminCommunityStoriesPage() {
  return (
    <AdminFrame activeSection="stories">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Historias de la comunidad</p>
          <h1 className={styles.adminTitle}>Entrecanciones</h1>
          <p className={styles.copy}>Selecciona, ordena y previsualiza las historias que forman el muro público.</p>
        </div>
      </header>
      <DemoNotice />
      <CommunityStoryManager initialStories={mockCommunityStories} />
    </AdminFrame>
  );
}
