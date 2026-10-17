import styles from "../admin.module.css";

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

function getNextPath(value: string | undefined) {
  if (value === "/admin" || value?.startsWith("/admin/")) {
    return value;
  }

  return "/admin/dedicatorias";
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const { error, next } = await searchParams;
  const nextPath = getNextPath(next);

  return (
    <main className={styles.shell}>
      <section aria-labelledby="admin-login-title" className={styles.panel}>
        <p className={styles.eyebrow}>Luis Felipe IV</p>
        <h1 className={styles.title} id="admin-login-title">
          Panel editorial
        </h1>
        <p className={styles.copy}>
          Ingresa la contraseña para administrar dedicatorias y contenido público.
        </p>
        {error === "invalid-credentials" ? (
          <p className={styles.error} role="alert">
            La contraseña no es correcta. Inténtalo de nuevo.
          </p>
        ) : null}
        <form action="/api/admin/login" className={styles.form} method="post">
          <input name="next" type="hidden" value={nextPath} />
          <label className={styles.label} htmlFor="password">
            Contraseña
          </label>
          <input
            autoComplete="current-password"
            className={styles.input}
            id="password"
            name="password"
            required
            type="password"
          />
          <button className={styles.button} type="submit">
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
