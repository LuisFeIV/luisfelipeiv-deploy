"use client";

import { Fragment, useMemo, useState } from "react";
import type { FormEvent } from "react";

import type { RibbonItemKind, RibbonItemViewModel } from "@/lib/admin/models";
import { buildRibbonTrack } from "@/lib/ribbon";

import styles from "../admin.module.css";
import { AdminFeedbackRegion, AdminTextField, MoveIcon, Spinner, VisibilityField } from "./form-controls";
import { useSiteContentMutations } from "./use-site-content-mutations";

type RibbonManagerProps = { initialItems: RibbonItemViewModel[] };
type RibbonDraft = Omit<RibbonItemViewModel, "id" | "order">;

const emptyRibbonItem: RibbonDraft = { label: "", kind: "artist", visible: true };

const kindLabels: Record<RibbonItemKind, string> = {
  artist: "Artista o banda",
  song: "Canción",
  phrase: "Frase",
};

function sortItems(items: RibbonItemViewModel[]) {
  return [...items].sort((first, second) => first.order - second.order);
}

export function RibbonManager({ initialItems }: RibbonManagerProps) {
  const firstItem = sortItems(initialItems)[0];
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(firstItem?.id ?? null);
  const [draft, setDraft] = useState<RibbonDraft>(firstItem ? { label: firstItem.label, kind: firstItem.kind, visible: firstItem.visible } : emptyRibbonItem);
  const [labelError, setLabelError] = useState<string>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { announcement, dismissFeedback, feedback, notify, pendingAction, remove, reorder, save, saving, setAnnouncement } = useSiteContentMutations("ribbon");
  const sortedItems = useMemo(() => sortItems(items), [items]);
  const isCreating = selectedId === null;

  const previewTrack = useMemo(() => {
    const withDraft = sortedItems.map((item) => item.id === selectedId ? { ...item, ...draft } : item);
    if (isCreating && draft.label.trim()) withDraft.push({ ...draft, id: "draft", order: withDraft.length + 1 });
    return buildRibbonTrack(withDraft.filter((item) => item.visible).map((item) => item.label));
  }, [draft, isCreating, selectedId, sortedItems]);

  function selectItem(item: RibbonItemViewModel) {
    setSelectedId(item.id);
    setDraft({ label: item.label, kind: item.kind, visible: item.visible });
    setLabelError(undefined);
    setConfirmingDelete(false);
    setAnnouncement(`${item.label} listo para editar.`);
  }

  function startCreating() {
    setSelectedId(null);
    setDraft(emptyRibbonItem);
    setLabelError(undefined);
    setConfirmingDelete(false);
    setAnnouncement("Formulario para un nuevo texto de la cinta.");
  }

  async function moveItem(id: string, direction: -1 | 1) {
    const ordered = sortItems(items);
    const currentIndex = ordered.findIndex((item) => item.id === id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) return;
    [ordered[currentIndex], ordered[targetIndex]] = [ordered[targetIndex], ordered[currentIndex]];
    const nextItems = ordered.map((item, index) => ({ ...item, order: index + 1 }));
    if (await reorder(nextItems)) setItems(nextItems);
  }

  async function toggleVisibility(item: RibbonItemViewModel) {
    const visible = !item.visible;
    const result = await save(item.id, { label: item.label, kind: item.kind, visible }, {
      action: `visibility:${item.id}`,
      successMessage: visible ? `«${item.label}» vuelve a aparecer en la cinta.` : `«${item.label}» ya no aparece en la cinta.`,
    });
    if (!result.success) return;
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, visible } : entry));
    if (selectedId === item.id) setDraft((current) => ({ ...current, visible }));
  }

  async function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = draft.label.trim();
    if (!label) {
      setLabelError("Escribe el nombre o la frase.");
      notify("error", "Escribe el nombre o la frase antes de guardar.");
      document.getElementById("ribbon-label")?.focus();
      return;
    }
    if (label.length > 100) {
      setLabelError("Usa 100 caracteres o menos.");
      notify("error", "El texto es demasiado largo para la cinta.");
      document.getElementById("ribbon-label")?.focus();
      return;
    }

    const next = { ...draft, label };
    const result = await save(selectedId, next, {
      successMessage: selectedId ? "Cinta actualizada. Ya se ve en el sitio." : `«${label}» se agregó al final de la cinta.`,
    });
    if (!result.success) return;
    if (selectedId) {
      setItems((current) => current.map((item) => item.id === selectedId ? { ...item, ...next } : item));
      setDraft(next);
      return;
    }
    if (!result.id) return;
    const created = { ...next, id: result.id, order: Math.max(0, ...items.map((item) => item.order)) + 1 };
    setItems((current) => [...current, created]);
    setSelectedId(created.id);
    setDraft(next);
  }

  async function deleteSelected() {
    if (!selectedId) return;
    const item = items.find((entry) => entry.id === selectedId);
    const deleted = await remove(selectedId, { action: "delete", successMessage: `«${item?.label ?? "Texto"}» se eliminó de la cinta.` });
    if (!deleted) return;
    const remaining = sortItems(items.filter((entry) => entry.id !== selectedId));
    setItems(remaining);
    setConfirmingDelete(false);
    if (remaining[0]) selectItem(remaining[0]);
    else startCreating();
  }

  const visibleCount = items.filter((item) => item.visible).length;

  return (
    <>
      <section aria-labelledby="ribbon-preview-title" className={styles.ribbonPreviewSection}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.sectionLabel}>Vista previa en vivo</p>
            <h2 id="ribbon-preview-title">Así se ve la cinta</h2>
          </div>
          <p className={styles.fieldHelp}>{visibleCount === 1 ? "1 texto visible" : `${visibleCount} textos visibles`} · se repite sola para no dejar huecos.</p>
        </div>
        <div aria-hidden="true" className={styles.ribbonPreview}>
          {previewTrack ? (
            <div className="tape-track" style={{ animationDuration: `${previewTrack.durationSeconds}s` }}>
              {previewTrack.items.map((label, index) => (
                <Fragment key={`${label}-${index}`}>
                  <span>{label}</span><span className="sep">·</span>
                </Fragment>
              ))}
            </div>
          ) : null}
        </div>
        {!previewTrack ? <p className={styles.inlineStatus} data-tone="error">No hay textos visibles. El sitio mostrará la cinta original hasta que actives al menos uno.</p> : null}
      </section>

      <div className={styles.managerGrid}>
        <section aria-labelledby="ribbon-list-title" className={styles.managerListPanel}>
          <div className={styles.panelHeading}>
            <div>
              <p className={styles.sectionLabel}>Orden de aparición</p>
              <h2 id="ribbon-list-title">Textos</h2>
            </div>
            <button className={styles.secondaryButton} disabled={saving} onClick={startCreating} type="button">Nuevo texto</button>
          </div>
          {sortedItems.length === 0 ? <p className={styles.fieldHelp}>Todavía no hay textos. Agrega el primero.</p> : null}
          <ol className={styles.managerList}>
            {sortedItems.map((item, index) => (
              <li className={styles.managerListItem} key={item.id}>
                <button aria-current={selectedId === item.id ? "true" : undefined} className={styles.managerSelectButton} onClick={() => selectItem(item)} type="button">
                  <span className={styles.orderNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <span><strong>{item.label}</strong><small>{kindLabels[item.kind]}</small></span>
                  <em>{item.visible ? "Visible" : "Oculto"}</em>
                </button>
                <div aria-label={`Acciones para ${item.label}`} className={styles.rowActions}>
                  <button aria-label={`Subir ${item.label}`} disabled={index === 0 || saving} onClick={() => moveItem(item.id, -1)} type="button"><MoveIcon direction="up" /></button>
                  <button aria-label={`Bajar ${item.label}`} disabled={index === sortedItems.length - 1 || saving} onClick={() => moveItem(item.id, 1)} type="button"><MoveIcon direction="down" /></button>
                  <button aria-busy={pendingAction === `visibility:${item.id}`} disabled={saving} onClick={() => toggleVisibility(item)} type="button">
                    {pendingAction === `visibility:${item.id}` ? <Spinner /> : null}
                    {item.visible ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="ribbon-editor-title" className={styles.editorPanel}>
          <div className={styles.panelHeading}>
            <div>
              <p className={styles.sectionLabel}>{isCreating ? "Nuevo texto" : "Edición"}</p>
              <h2 id="ribbon-editor-title">{isCreating ? "Agregar a la cinta" : "Editar texto"}</h2>
            </div>
          </div>
          <form className={styles.editorForm} noValidate onSubmit={submitDraft}>
            <AdminTextField
              error={labelError}
              help="Se muestra en mayúsculas, igual que en el sitio. Los nuevos textos se agregan al final."
              id="ribbon-label"
              label="Nombre o frase"
              onChange={(label) => { setDraft((current) => ({ ...current, label })); setLabelError(undefined); }}
              required
              value={draft.label}
            />
            <div className={styles.formField}>
              <label htmlFor="ribbon-kind">Tipo</label>
              <select id="ribbon-kind" onChange={(event) => setDraft((current) => ({ ...current, kind: event.target.value as RibbonItemKind }))} value={draft.kind}>
                {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <VisibilityField checked={draft.visible} id="ribbon-visible" onChange={(visible) => setDraft((current) => ({ ...current, visible }))} />
            <div className={styles.formActions}>
              <button aria-busy={pendingAction === "save"} className={styles.primaryButton} disabled={saving} type="submit">
                {pendingAction === "save" ? <><Spinner />Guardando…</> : isCreating ? "Agregar a la cinta" : "Guardar texto"}
              </button>
              <button
                className={styles.textButton}
                disabled={saving}
                onClick={() => {
                  const original = items.find((item) => item.id === selectedId);
                  setDraft(original ? { label: original.label, kind: original.kind, visible: original.visible } : emptyRibbonItem);
                  setLabelError(undefined);
                  setAnnouncement(original ? "Cambios descartados." : "Formulario vacío.");
                }}
                type="button"
              >
                Descartar cambios
              </button>
            </div>
            {!isCreating ? (
              <div className={styles.dangerZone}>
                {confirmingDelete ? (
                  <>
                    <p>¿Eliminar «{items.find((item) => item.id === selectedId)?.label}» de la cinta? Esta acción no se puede deshacer. Si sólo quieres quitarlo por un tiempo, ocúltalo.</p>
                    <div className={styles.formActions}>
                      <button aria-busy={pendingAction === "delete"} className={styles.dangerButton} disabled={saving} onClick={deleteSelected} type="button">
                        {pendingAction === "delete" ? <><Spinner />Eliminando…</> : "Sí, eliminar"}
                      </button>
                      <button className={styles.textButton} disabled={saving} onClick={() => setConfirmingDelete(false)} type="button">Cancelar</button>
                    </div>
                  </>
                ) : (
                  <button className={styles.textButton} disabled={saving} onClick={() => setConfirmingDelete(true)} type="button">Eliminar este texto</button>
                )}
              </div>
            ) : null}
          </form>
        </section>
        <AdminFeedbackRegion announcement={announcement} feedback={feedback} onDismiss={dismissFeedback} />
      </div>
    </>
  );
}
