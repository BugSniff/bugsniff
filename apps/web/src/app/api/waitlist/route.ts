import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, feedback, source } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email é obrigatório." }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    const { error } = await supabase.from("waitlist").insert({
      email: trimmedEmail,
      feedback: feedback?.trim() || null,
      source: source || "hero",
    });

    if (error) {
      // Duplicate email
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Esse email já está na lista. Te avisaremos em breve!" },
          { status: 409 }
        );
      }
      console.error("[waitlist] Supabase error:", error);
      return NextResponse.json(
        { error: "Erro ao salvar. Tente novamente." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[waitlist] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erro interno. Tente novamente." },
      { status: 500 }
    );
  }
}
