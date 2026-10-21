"use client";

import { useCallback, useState } from "react";

import type { SiteContentCollection, SiteContentDraft } from "@/lib/admin/content-schemas";
import type { AboutImageViewModel, AdminPlaylistViewModel, ArchiveItemViewModel, CommunityStoryViewModel, DedicationRecommendationViewModel, PublicNumberViewModel, RibbonItemViewModel } from "@/lib/admin/models";
import { deleteSiteContent, reorderSiteContent, saveSiteContent } from "../site-content-actions";

type OrderedContent = Array<AdminPlaylistViewModel | ArchiveItemViewModel | CommunityStoryViewModel | PublicNumberViewModel | RibbonItemViewModel | AboutImageViewModel | DedicationRecommendationViewModel>;

export type AdminFeedback = { id: number; message: string; tone: "error" | "success" };

type MutationOptions = { action?: string; successMessage?: string };

export function useSiteContentMutations(collection: SiteContentCollection) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);

  const notify = useCallback((tone: AdminFeedback["tone"], message: string) => {
    setFeedback({ id: Date.now(), message, tone });
  }, []);
  const dismissFeedback = useCallback(() => setFeedback(null), []);

  async function save(id: string | null, draft: SiteContentDraft, options: MutationOptions = {}) {
    setPendingAction(options.action ?? "save");
    let result;
    try {
      result = await saveSiteContent(collection, id, draft);
    } catch {
      result = { success: false as const, message: "No pudimos guardar los cambios. Revisa tu conexión e inténtalo de nuevo." };
    } finally {
      setPendingAction(null);
    }
    if (result.success) notify("success", options.successMessage ?? "Cambios guardados. Ya se ven en el sitio.");
    else notify("error", result.message);
    return result;
  }

  async function reorder(items: OrderedContent) {
    setPendingAction("reorder");
    let result;
    try {
      result = await reorderSiteContent(collection, items.map((item) => ({ id: item.id, order: item.order })));
    } catch {
      result = { success: false as const, message: "No pudimos guardar el nuevo orden. Inténtalo de nuevo." };
    } finally {
      setPendingAction(null);
    }
    if (result.success) notify("success", "Nuevo orden guardado.");
    else notify("error", result.message);
    return result.success;
  }

  async function remove(id: string, options: MutationOptions = {}) {
    setPendingAction(options.action ?? `delete:${id}`);
    let result;
    try {
      result = await deleteSiteContent(collection, id);
    } catch {
      result = { success: false as const, message: "No pudimos eliminarlo. Inténtalo de nuevo." };
    } finally {
      setPendingAction(null);
    }
    if (result.success) notify("success", options.successMessage ?? "Elemento eliminado.");
    else notify("error", result.message);
    return result.success;
  }

  return {
    announcement,
    dismissFeedback,
    feedback,
    notify,
    pendingAction,
    remove,
    reorder,
    save,
    saving: pendingAction !== null,
    setAnnouncement,
  };
}
