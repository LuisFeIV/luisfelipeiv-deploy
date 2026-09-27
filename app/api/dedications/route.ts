import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dedicationSubmissionSchema } from "@/lib/validations/dedication";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "La solicitud no tiene un formato válido." },
      { status: 400 },
    );
  }

  const parsed = dedicationSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Revisa los datos de tu historia.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { website, ...dedication } = parsed.data;

  if (website) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("dedications").insert({
      allow_publishing: dedication.allowPublishing,
      artist: dedication.artist,
      instagram: dedication.instagram ?? null,
      message: dedication.message,
      recipient_name: dedication.recipientName ?? null,
      sender_name: dedication.senderName ?? null,
      song: dedication.song,
    });

    if (error) {
      console.error("Unable to save dedication.", error);

      return NextResponse.json(
        { error: "No pudimos guardar tu historia. Inténtalo de nuevo." },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Unable to initialize Supabase.", error);

    return NextResponse.json(
      { error: "No pudimos guardar tu historia. Inténtalo de nuevo." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
