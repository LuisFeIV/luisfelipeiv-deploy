"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import styles from "../admin.module.css";

type MediaAsset = {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
};

type MediaPickerProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  help?: string;
};

async function prepareImage(file: File) {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 2560 / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) throw new Error("No pudimos preparar la imagen en este navegador.");
  context.drawImage(image, 0, 0, width, height);
  image.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error("No pudimos comprimir la imagen.")),
      "image/jpeg",
      0.92,
    );
  });

  return { file: new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }), width, height };
}

export function MediaPicker({ id, label, value, onChange, error, help }: MediaPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [previewState, setPreviewState] = useState<{ src: string; aspectRatio: number | null; error: boolean }>({ src: value, aspectRatio: null, error: false });
  const imageAspectRatio = previewState.src === value ? previewState.aspectRatio : null;
  const previewError = previewState.src === value && previewState.error;

  useEffect(() => {
    if (!libraryOpen) return;
    let cancelled = false;

    async function loadLibrary() {
      try {
        const response = await fetch("/api/admin/media", { cache: "no-store" });
        const payload = await response.json() as { assets?: MediaAsset[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "No pudimos cargar la biblioteca.");
        if (!cancelled) setAssets(payload.assets ?? []);
      } catch (cause) {
        if (!cancelled) setMessage(cause instanceof Error ? cause.message : "No pudimos cargar la biblioteca.");
      }
    }

    void loadLibrary();
    return () => { cancelled = true; };
  }, [libraryOpen]);

  async function upload(file: File) {
    setLoading(true);
    setMessage("Preparando imagen…");

    try {
      const prepared = await prepareImage(file);
      if (Math.max(prepared.width, prepared.height) < 900 || Math.min(prepared.width, prepared.height) < 600) {
        throw new Error("La imagen debe tener al menos 900 px en su lado largo y 600 px en el corto para conservar nitidez.");
      }
      if (prepared.file.size > 4 * 1024 * 1024) {
        throw new Error("La imagen optimizada supera 4 MB. Prueba con una foto más ligera.");
      }

      const formData = new FormData();
      formData.set("file", prepared.file);
      formData.set("width", String(prepared.width));
      formData.set("height", String(prepared.height));
      const response = await fetch("/api/admin/media", { method: "POST", body: formData });
      const payload = await response.json() as { asset?: MediaAsset; error?: string };
      if (!response.ok || !payload.asset) throw new Error(payload.error ?? "No pudimos subir la imagen.");

      setAssets((current) => [payload.asset!, ...current]);
      onChange(payload.asset.url);
      setMessage("Imagen lista y guardada.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "No pudimos subir la imagen.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <fieldset className={styles.mediaPicker}>
      <legend>{label}</legend>
      {value ? (
        <div className={styles.mediaSelected}>
          <div
            className={styles.mediaPreview}
            style={{
              aspectRatio: imageAspectRatio ? String(imageAspectRatio) : "4 / 3",
              maxWidth: imageAspectRatio ? `${Math.min(720, 560 * imageAspectRatio)}px` : "720px",
            }}
          >
            <Image
              alt="Vista previa completa de la imagen seleccionada"
              fill
              onError={() => setPreviewState({ src: value, aspectRatio: null, error: true })}
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget;
                if (naturalWidth && naturalHeight) setPreviewState({ src: value, aspectRatio: naturalWidth / naturalHeight, error: false });
              }}
              sizes="(max-width: 700px) 100vw, 720px"
              src={value}
              unoptimized={!value.startsWith("/images/")}
            />
            {previewError ? <p className={styles.mediaPreviewError} role="status">No pudimos cargar esta imagen. Reemplázala o quítala para continuar.</p> : null}
          </div>
          <div className={styles.mediaSelectedActions}>
            <span>Imagen seleccionada</span>
          <button className={styles.textButton} onClick={() => { onChange(""); setMessage(""); }} type="button">Quitar imagen</button>
          </div>
        </div>
      ) : (
        <div className={styles.mediaDropzone}>
          <span className={styles.mediaDropzoneIcon} aria-hidden="true">↑</span>
          <strong>Sube una foto nítida</strong>
          <small>JPEG, PNG o WebP · lado largo 900 px y corto 600 px</small>
        </div>
      )}
      {help ? <p className={styles.fieldHelp}>{help}</p> : null}
      {error ? <p className={styles.fieldError} role="alert">{error}</p> : null}
      <div className={styles.mediaActions}>
        <button className={styles.secondaryButton} disabled={loading} onClick={() => inputRef.current?.click()} type="button">
          {loading ? "Preparando…" : value ? "Reemplazar imagen" : "Subir imagen"}
        </button>
        <button className={styles.textButton} onClick={() => setLibraryOpen((open) => !open)} type="button">
          {libraryOpen ? "Cerrar biblioteca" : "Elegir de la biblioteca"}
        </button>
      </div>
      <p className={styles.fieldHelp}>La biblioteca se llena automáticamente con las imágenes que subes aquí y te permite reutilizarlas en Archivo, Playlists y Quién soy.</p>
      <input
        accept="image/jpeg,image/png,image/webp"
        className={styles.visuallyHidden}
        id={id}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) void upload(file);
        }}
        ref={inputRef}
        type="file"
      />
      {message ? <p aria-live="polite" className={loading ? styles.fieldHelp : styles.mediaStatus}>{message}</p> : null}
      {libraryOpen ? (
        <div aria-label="Biblioteca de imágenes" className={styles.mediaLibrary}>
          {assets.length ? assets.map((asset) => (
            <button aria-label={`Elegir ${asset.name}`} className={styles.mediaLibraryItem} key={asset.id} onClick={() => { onChange(asset.url); setLibraryOpen(false); }} type="button">
              <span className={styles.mediaLibraryPreview}><Image alt="" fill sizes="160px" src={asset.url} unoptimized /></span>
              <small>{asset.name}</small>
            </button>
          )) : <p className={styles.fieldHelp}>Aún no hay imágenes subidas. Puedes subir una desde aquí.</p>}
        </div>
      ) : null}
    </fieldset>
  );
}
