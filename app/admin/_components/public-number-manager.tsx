"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import type {
  PublicNumberDraft,
  PublicNumberViewModel,
} from "@/lib/admin/models";
import {
  validatePublicNumberDraft,
  type PublicNumberDraftErrors,
} from "@/lib/admin/validation";

import styles from "../admin.module.css";
import { AdminTextField, MoveIcon, VisibilityField } from "./form-controls";

type PublicNumberManagerProps = {
  initialNumbers: PublicNumberViewModel[];
};

const emptyNumber: PublicNumberDraft = {
  platform: "",
  value: "",
  suffix: "",
  description: "",
  visible: true,
};

function sortNumbers(items: PublicNumberViewModel[]) {
  return [...items].sort((first, second) => first.order - second.order);
}

export function PublicNumberManager({ initialNumbers }: PublicNumberManagerProps) {
  const firstNumber = sortNumbers(initialNumbers)[0];
  const [numbers, setNumbers] = useState(initialNumbers);
  const [selectedId, setSelectedId] = useState<string | null>(firstNumber?.id ?? null);
  const [draft, setDraft] = useState<PublicNumberDraft>(
    firstNumber ? { ...firstNumber } : emptyNumber,
  );
  const [errors, setErrors] = useState<PublicNumberDraftErrors>({});
  const [announcement, setAnnouncement] = useState("");
  const sortedNumbers = useMemo(() => sortNumbers(numbers), [numbers]);
  const isCreating = selectedId === null;

  function updateDraft<Key extends keyof PublicNumberDraft>(
    field: Key,
    value: PublicNumberDraft[Key],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function selectNumber(item: PublicNumberViewModel) {
    setSelectedId(item.id);
    setDraft({ ...item });
    setErrors({});
    setAnnouncement(`${item.platform} listo para editar.`);
  }

  function startCreating() {
    setSelectedId(null);
    setDraft(emptyNumber);
    setErrors({});
    setAnnouncement("Formulario para un nuevo número público.");
  }

  function moveNumber(id: string, direction: -1 | 1) {
    setNumbers((current) => {
      const ordered = sortNumbers(current);
      const currentIndex = ordered.findIndex((item) => item.id === id);
      const targetIndex = currentIndex + direction;

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) {
        return current;
      }

      const reordered = [...ordered];
      [reordered[currentIndex], reordered[targetIndex]] = [
        reordered[targetIndex],
        reordered[currentIndex],
      ];

      return reordered.map((item, index) => ({ ...item, order: index + 1 }));
    });
    setAnnouncement("Orden actualizado sólo en esta demostración.");
  }

  function toggleVisibility(item: PublicNumberViewModel) {
    const visible = !item.visible;
    setNumbers((current) =>
      current.map((number) => number.id === item.id ? { ...number, visible } : number),
    );
    if (selectedId === item.id) {
      setDraft((current) => ({ ...current, visible }));
    }
    setAnnouncement(`${item.platform} ahora está ${visible ? "visible" : "oculto"} en esta demostración.`);
  }

  function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validatePublicNumberDraft(draft);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setAnnouncement("Revisa los campos marcados antes de continuar.");
      requestAnimationFrame(() => {
        form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    if (selectedId) {
      setNumbers((current) =>
        current.map((item) => item.id === selectedId ? { ...item, ...draft } : item),
      );
      setAnnouncement("Cambios aplicados sólo en esta demostración.");
      return;
    }

    const id = `number-demo-${numbers.length + 1}`;
    const item: PublicNumberViewModel = {
      ...draft,
      id,
      order: numbers.length + 1,
    };
    setNumbers((current) => [...current, item]);
    setSelectedId(id);
    setAnnouncement("Número creado sólo en esta demostración.");
  }

  return (
    <div className={styles.managerGrid}>
      <section aria-labelledby="numbers-list-title" className={styles.managerListPanel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.sectionLabel}>Orden del sitio</p>
            <h2 id="numbers-list-title">Números públicos</h2>
          </div>
          <button className={styles.secondaryButton} onClick={startCreating} type="button">
            Nuevo número
          </button>
        </div>
        <ol className={styles.managerList}>
          {sortedNumbers.map((item, index) => (
            <li className={styles.managerListItem} key={item.id}>
              <button
                aria-current={selectedId === item.id ? "true" : undefined}
                className={styles.managerSelectButton}
                onClick={() => selectNumber(item)}
                type="button"
              >
                <span className={styles.orderNumber}>{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <strong>{item.platform}</strong>
                  <small>{item.value}{item.suffix} · {item.description}</small>
                </span>
                <em>{item.visible ? "Visible" : "Oculto"}</em>
              </button>
              <div aria-label={`Acciones para ${item.platform}`} className={styles.rowActions}>
                <button
                  aria-label={`Subir ${item.platform}`}
                  disabled={index === 0}
                  onClick={() => moveNumber(item.id, -1)}
                  type="button"
                >
                  <MoveIcon direction="up" />
                </button>
                <button
                  aria-label={`Bajar ${item.platform}`}
                  disabled={index === sortedNumbers.length - 1}
                  onClick={() => moveNumber(item.id, 1)}
                  type="button"
                >
                  <MoveIcon direction="down" />
                </button>
                <button onClick={() => toggleVisibility(item)} type="button">
                  {item.visible ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="number-editor-title" className={styles.editorPanel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.sectionLabel}>{isCreating ? "Nuevo elemento" : "Edición local"}</p>
            <h2 id="number-editor-title">{isCreating ? "Crear número" : "Editar número"}</h2>
          </div>
        </div>
        <form className={styles.editorForm} noValidate onSubmit={submitDraft}>
          <AdminTextField
            error={errors.platform}
            id="number-platform"
            label="Plataforma o indicador"
            onChange={(value) => updateDraft("platform", value)}
            required
            value={draft.platform}
          />
          <div className={styles.twoColumnFields}>
            <AdminTextField
              error={errors.value}
              help="Ejemplo: 476 o 29.6"
              id="number-value"
              label="Cifra"
              onChange={(value) => updateDraft("value", value)}
              required
              value={draft.value}
            />
            <AdminTextField
              error={errors.suffix}
              help="Ejemplo: mil o M"
              id="number-suffix"
              label="Unidad o sufijo"
              onChange={(value) => updateDraft("suffix", value)}
              required
              value={draft.suffix}
            />
          </div>
          <AdminTextField
            error={errors.description}
            id="number-description"
            label="Descripción"
            onChange={(value) => updateDraft("description", value)}
            required
            value={draft.description}
          />
          <VisibilityField
            checked={draft.visible}
            id="number-visible"
            onChange={(checked) => updateDraft("visible", checked)}
          />
          <div className={styles.formActions}>
            <button className={styles.primaryButton} type="submit">
              Aplicar en demo
            </button>
            <button
              className={styles.textButton}
              onClick={() => {
                const original = numbers.find((item) => item.id === selectedId);
                setDraft(original ? { ...original } : emptyNumber);
                setErrors({});
                setAnnouncement("Cambios del formulario descartados.");
              }}
              type="button"
            >
              Descartar cambios
            </button>
          </div>
        </form>

        <div aria-label="Vista previa del número público" className={styles.previewSection}>
          <p className={styles.sectionLabel}>Vista previa</p>
          <article className={styles.numberPreview}>
            <p>{draft.platform || "Plataforma"}</p>
            <strong>{draft.value || "0"}<span>{draft.suffix || "unidad"}</span></strong>
            <small>{draft.description || "La descripción aparecerá aquí."}</small>
            <em>{draft.visible ? "Visible" : "Oculto"}</em>
          </article>
        </div>
      </section>
      <p aria-live="polite" className={styles.srOnly}>{announcement}</p>
    </div>
  );
}
