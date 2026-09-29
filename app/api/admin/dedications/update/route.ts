import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminSessionCookieName, hasValidAdminSession } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminDedicationStatusUpdateSchema } from "@/lib/validations/dedication";

const statusFilterValues = [
  "all",
  "pending",
  "approved",
  "published",
  "rejected",
] as const;

const permissionFilterValues = ["all", "authorized"] as const;

type StatusFilter = (typeof statusFilterValues)[number];
type PermissionFilter = (typeof permissionFilterValues)[number];

function getStatusFilter(value: FormDataEntryValue | null): StatusFilter {
  if (
    typeof value === "string" &&
    statusFilterValues.some((filter) => filter === value)
  ) {
    return value as StatusFilter;
  }

  return "all";
}

function getPermissionFilter(value: FormDataEntryValue | null): PermissionFilter {
  if (
    typeof value === "string" &&
    permissionFilterValues.some((filter) => filter === value)
  ) {
    return value as PermissionFilter;
  }

  return "all";
}

function getAdminUrl(
  request: Request,
  status: StatusFilter,
  permission: PermissionFilter,
  options: { error?: string; updatedId?: string } = {},
) {
  const url = new URL("/admin/dedicatorias", request.url);

  if (status !== "all") {
    url.searchParams.set("status", status);
  }

  if (permission !== "all") {
    url.searchParams.set("permission", permission);
  }

  if (options.error) {
    url.searchParams.set("error", options.error);
  }

  if (options.updatedId) {
    url.searchParams.set("updated", options.updatedId);
    url.hash = `dedication-${options.updatedId}`;
  }

  return url;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;

  if (!(await hasValidAdminSession(token))) {
    return NextResponse.redirect(new URL("/admin/login", request.url), {
      status: 303,
    });
  }

  const formData = await request.formData();
  const statusFilter = getStatusFilter(formData.get("filterStatus"));
  const permissionFilter = getPermissionFilter(formData.get("filterPermission"));
  const parsed = adminDedicationStatusUpdateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return NextResponse.redirect(
      getAdminUrl(request, statusFilter, permissionFilter, {
        error: "invalid-update",
      }),
      { status: 303 },
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("dedications")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      console.error("Unable to update dedication status.", error);

      return NextResponse.redirect(
        getAdminUrl(request, statusFilter, permissionFilter, {
          error: "update-failed",
        }),
        { status: 303 },
      );
    }
  } catch (error) {
    console.error("Unable to initialize Supabase.", error);

    return NextResponse.redirect(
      getAdminUrl(request, statusFilter, permissionFilter, {
        error: "update-failed",
      }),
      { status: 303 },
    );
  }

  return NextResponse.redirect(
    getAdminUrl(request, statusFilter, permissionFilter, {
      updatedId: parsed.data.id,
    }),
    { status: 303 },
  );
}
