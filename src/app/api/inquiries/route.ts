import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimiter } from "@/lib/rate-limit";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const inquirySchema = z.object({
  name: z.string().trim().min(1, "Required").max(200, "Too long"),
  email: z.string().trim().email("Invalid email").max(200, "Too long"),
  nachricht: z
    .string()
    .trim()
    .min(20, "Min 20 characters")
    .max(5000, "Too long"),
  paket: z.string().trim().min(1, "Required").max(200, "Too long"),
  leistung: z.array(z.string().max(200)).max(10, "Max 10 services").optional(),
  telefon: z.string().trim().max(100, "Too long").optional().or(z.literal("")),
  unternehmen: z
    .string()
    .trim()
    .max(200, "Too long")
    .optional()
    .or(z.literal("")),
  sprache: z.enum(["de", "tr", "en"]),
});

function getAllowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function corsHeaders(origin: string | null): Record<string, string> {
  if (origin && getAllowedOrigins().includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      Vary: "Origin",
    };
  }
  return {};
}

function detectLanguage(
  request: NextRequest,
  posted: FormDataEntryValue | null,
): "de" | "tr" | "en" {
  if (posted === "de" || posted === "tr" || posted === "en") return posted;
  try {
    const path = new URL(request.headers.get("referer") || "").pathname;
    if (path === "/en" || path.startsWith("/en/")) return "en";
    if (path === "/tr" || path.startsWith("/tr/")) return "tr";
  } catch {
  }
  return "de";
}
export async function GET() {
  console.log("[API] GET /api/inquiries reached");
  return NextResponse.json({ ok: true, message: "Inquiries API is running" });
}

export async function OPTIONS(request: NextRequest) {
  console.log(
    "[API] OPTIONS (preflight) from origin:",
    request.headers.get("origin"),
  );
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  console.log("[API] ===== POST /api/inquiries RECEIVED =====");
  console.log("[API] origin:", origin);
  console.log("[API] allowed origins:", getAllowedOrigins());

  const headers = corsHeaders(origin);
  const json = (body: unknown, status: number) =>
    NextResponse.json(body, { status, headers });

  if (!origin || !getAllowedOrigins().includes(origin)) {
    console.log("[API] REJECTED 403: origin not allowed ->", origin);
    return json({ error: "Forbidden" }, 403);
  }

  // 2. Rate limiting
  const ip = (request.headers.get("x-forwarded-for") || "unknown")
    .split(",")[0]
    .trim();
  try {
    const result: any = await rateLimiter.consume(ip);
    if (result && result.success === false) {
      console.log("[API] REJECTED 429: rate limit, ip:", ip);
      return json({ error: "Too many requests" }, 429);
    }
  } catch {
    console.log("[API] REJECTED 429: rate limit, ip:", ip);
    return json({ error: "Too many requests" }, 429);
  }

  try {
    // 3. Parse FormData
    const formData = await request.formData();
    console.log("[API] form fields received:", Array.from(formData.keys()));

    const _gotcha = formData.get("_gotcha") as string;

    // 4. Honeypot only (the 3-second silent drop was removed so nothing is dropped without a log)
    if (_gotcha && _gotcha.trim() !== "") {
      console.log("[API] honeypot filled, ignoring (bot)");
      return json({ success: true }, 200);
    }

    // 5. Extract and validate
    const rawLeistung = [
      ...formData.getAll("leistung"),
      ...formData.getAll("leistung[]"),
    ].filter((v): v is string => typeof v === "string" && v.trim() !== "");
    const leistung = rawLeistung.length > 0 ? rawLeistung : undefined;

    const validated = inquirySchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      nachricht: formData.get("nachricht"),
      paket: formData.get("paket"),
      leistung,
      telefon: formData.get("telefon") || undefined,
      unternehmen: formData.get("unternehmen") || undefined,
      sprache: detectLanguage(request, formData.get("sprache")),
    });
    console.log("[API] validation OK for:", validated.email);
    const saved = await prisma.inquiry.create({
      data: {
        name: validated.name,
        email: validated.email,
        nachricht: validated.nachricht,
        paket: validated.paket,
        leistung: validated.leistung || [],
        telefon: validated.telefon || null,
        unternehmen: validated.unternehmen || null,
        sprache: validated.sprache,
        status: "new",
      },
    });
    console.log("[API] SAVED to database, id:", saved.id);
    if (resend) {
      try {
        const adminEmail =
          process.env.DEFAULT_ADMIN_EMAIL || "hallo@surhay.design";
        const result = await resend.emails.send({
          from: "Surhay Design <onboarding@resend.dev>",
          to: adminEmail,
          subject: `Neue Anfrage: ${validated.paket} (${validated.sprache.toUpperCase()})`,
          html: `
          <h2>Neue Kontaktanfrage</h2>
          <p><strong>Name:</strong> ${validated.name}</p>
          <p><strong>E-Mail:</strong> ${validated.email}</p>
          <p><strong>Telefon:</strong> ${validated.telefon || "-"}</p>
          <p><strong>Unternehmen:</strong> ${validated.unternehmen || "-"}</p>
          <p><strong>Paket:</strong> ${validated.paket}</p>
          <p><strong>Leistungen:</strong> ${validated.leistung?.join(", ") || "Keine"}</p>
          <p><strong>Nachricht:</strong><br/>${validated.nachricht.replace(/\n/g, "<br/>")}</p>
        `,
        });
        if (result.error) {
          console.error(
            "[API] Resend error (inquiry was saved):",
            result.error,
          );
        }
      } catch (mailError) {
        console.error("[API] Email failed (inquiry was saved):", mailError);
      }
    } else {
      console.warn("[API] RESEND_API_KEY missing, email skipped");
    }

    return json({ success: true }, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // console.error('[API] VALIDATION FAILED:', JSON.stringify(error.errors));
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation failed" },
        { status: 400 },
      );
    }
    console.error("[API] ERROR (database or other):", error);
    return json({ error: "Internal server error" }, 500);
  }
}
