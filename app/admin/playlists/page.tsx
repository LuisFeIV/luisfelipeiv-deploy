import { AdminFrame } from "../_components/admin-frame";
import { PlaylistManager } from "../_components/playlist-manager";
import styles from "../admin.module.css";
import { listAdminPlaylists } from "@/lib/db/site-content";

export const dynamic = "force-dynamic";

export default async function AdminPlaylistsPage() {
  const playlists = await listAdminPlaylists();
  return (
    <AdminFrame activeSection="playlists">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Contenido público</p>
          <h1 className={styles.adminTitle}>Playlists</h1>
          <p className={styles.copy}>Crea, ordena y previsualiza las tarjetas que aparecen en el sitio.</p>
        </div>
      </header>
      <PlaylistManager initialPlaylists={playlists} />
    </AdminFrame>
  );
}
