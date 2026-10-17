import styles from "../admin.module.css";

type TextFieldProps = {
  error?: string;
  help?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "url";
  value: string;
};

type TextAreaFieldProps = Omit<TextFieldProps, "type">;

type VisibilityFieldProps = {
  checked: boolean;
  id: string;
  onChange: (checked: boolean) => void;
};

type MoveIconProps = {
  direction: "down" | "up";
};

export function MoveIcon({ direction }: MoveIconProps) {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path
        d={direction === "up" ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function AdminTextField({
  error,
  help,
  id,
  label,
  onChange,
  required = false,
  type = "text",
  value,
}: TextFieldProps) {
  const descriptionId = error ? `${id}-error` : help ? `${id}-help` : undefined;

  return (
    <div className={styles.formField}>
      <label htmlFor={id}>
        {label}{required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
      {error ? <p className={styles.fieldError} id={`${id}-error`}>{error}</p> : null}
      {!error && help ? <p className={styles.fieldHelp} id={`${id}-help`}>{help}</p> : null}
    </div>
  );
}

export function AdminTextAreaField({
  error,
  help,
  id,
  label,
  onChange,
  required = false,
  value,
}: TextAreaFieldProps) {
  const descriptionId = error ? `${id}-error` : help ? `${id}-help` : undefined;

  return (
    <div className={styles.formField}>
      <label htmlFor={id}>
        {label}{required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <textarea
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        rows={4}
        value={value}
      />
      {error ? <p className={styles.fieldError} id={`${id}-error`}>{error}</p> : null}
      {!error && help ? <p className={styles.fieldHelp} id={`${id}-help`}>{help}</p> : null}
    </div>
  );
}

export function VisibilityField({ checked, id, onChange }: VisibilityFieldProps) {
  return (
    <div className={styles.visibilityField}>
      <div>
        <label htmlFor={id}>Visible en el sitio</label>
        <p>Ocultarlo sólo cambia esta demostración.</p>
      </div>
      <input
        checked={checked}
        id={id}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </div>
  );
}
