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
import { AdminFeedbackRegion, AdminTextField, MoveIcon, Spinner, VisibilityField } from "./form-controls";
import { useSiteContentMutations } from "./use-site-content-mutations";

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
  const { announcement, dismissFeedback, feedback, notify, pendingAction, reorder, save, saving, setAnnouncement } = useSiteContentMutations("numbers");
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

  async function moveNumber(id: string, direction: -1 | 1) {
    const ordered = sortNumbers(numbers);
    const currentIndex = ordered.findIndex((item) => item.id === id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) return;
    [ordered[currentIndex], ordered[targetIndex]] = [ordered[targetIndex], ordered[currentIndex]];
    const nextNumbers = ordered.map((item, index) => ({ ...item, order: index + 1 }));
    if (await reorder(nextNumbers)) setNumbers(nextNumbers);
  }

  async function toggleVisibility(item: PublicNumberViewModel) {
    const visible = !item.visible;
    const { id: _id, order: _order, ...values } = item;
    const result = await save(item.id, { ...values, visible }, {
      action: `visibility:${item.id}`,
      successMessage: visible ? `«${item.platform}» ahora es visible en el sitio.` : `«${item.platform}» quedó oculto del sitio.`,
    });
    if (!result.success) return;
    setNumbers((current) => current.map((number) => number.id === item.id ? { ...number, visible } : number));
    if (selectedId === item.id) setDraft((current) => ({ ...current, visible }));
  }

  async function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validatePublicNumberDraft(draft);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      notify("error", "Revisa los campos marcados antes de continuar.");
      requestAnimationFrame(() => {
        form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    const values = { platform: draft.platform, value: draft.value, suffix: draft.suffix, description: draft.description, visible: draft.visible };
    const result = await save(selectedId, values, {
      successMessage: selectedId ? "Número guardado. Ya se ve en el sitio." : "Número agregado al final de la sección.",
    });
    if (!result.success) return;
    if (selectedId) {
      setNumbers((current) => current.map((item) => item.id === selectedId ? { ...item, ...values } : item));
      return;
    }
    if (!result.id) return;
    const id = result.id;
    setNumbers((current) => [...current, { ...values, id, order: Math.max(0, ...current.map((item) => item.order)) + 1 }]);
    setSelectedId(id);
  }

  return (
    <div className={styles.managerGrid}>
      <section aria-labelledby="numbers-list-title" className={styles.managerListPanel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.sectionLabel}>Orden del sitio</p>
            <h2 id="numbers-list-title">Números públicos</h2>
          </div>
          <button className={styles.secondaryButton} disabled={saving} onClick={startCreating} type="button">
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
                  disabled={index === 0 || saving}
                  onClick={() => moveNumber(item.id, -1)}
                  type="button"
                >
                  <MoveIcon direction="up" />
                </button>
                <button
                  aria-label={`Bajar ${item.platform}`}
                  disabled={index === sortedNumbers.length - 1 || saving}
                  onClick={() => moveNumber(item.id, 1)}
                  type="button"
                >
                  <MoveIcon direction="down" />
                </button>
                <button aria-busy={pendingAction === `visibility:${item.id}`} disabled={saving} onClick={() => toggleVisibility(item)} type="button">
                  {pendingAction === `visibility:${item.id}` ? <Spinner /> : null}
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
            <p className={styles.sectionLabel}>{isCreating ? "Nuevo elemento" : "Edición guardada"}</p>
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
            <button aria-busy={pendingAction === "save"} className={styles.primaryButton} disabled={saving} type="submit">
              {pendingAction === "save" ? <><Spinner />Guardando…</> : "Guardar número"}
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
      <AdminFeedbackRegion announcement={announcement} feedback={feedback} onDismiss={dismissFeedback} />
    </div>
  );
}
