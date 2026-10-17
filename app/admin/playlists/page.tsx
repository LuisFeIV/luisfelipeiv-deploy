import { AdminFrame, DemoNotice } from "../_components/admin-frame";
import { PlaylistManager } from "../_components/playlist-manager";
import styles from "../admin.module.css";
import { mockAdminPlaylists } from "@/lib/admin/mock-data";

export default function AdminPlaylistsPage() {
  return (
    <AdminFrame activeSection="playlists">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Contenido público</p>
          <h1 className={styles.adminTitle}>Playlists</h1>
          <p className={styles.copy}>Crea, ordena y previsualiza las tarjetas que aparecen en el sitio.</p>
        </div>
      </header>
      <DemoNotice />
      <PlaylistManager initialPlaylists={mockAdminPlaylists} />
    </AdminFrame>
  );
}
