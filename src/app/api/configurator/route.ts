import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimiter } from "@/lib/rate-limit";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const configuratorSchema = z.object({
  typ: z.string().trim().min(1, "Required").max(200, "Too long"),
  extras: z.array(z.string().max(200)).max(10, "Max 10 extras").optional(),
  wartung: z.string().trim().min(1, "Required").max(200, "Too long"),
  konfiguration: z.string().trim().min(1, "Required").max(1000, "Too long"),
  name: z.string().trim().min(1, "Required").max(200, "Too long"),
  email: z.string().trim().email("Invalid email").max(200, "Too long"),
  anmerkungen: z
    .string()
    .trim()
    .max(2000, "Too long")
    .optional()
    .or(z.literal("")),
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim());
  if (!origin || !allowedOrigins.includes(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = (request.headers.get("x-forwarded-for") || "unknown")
    .split(",")[0]
    .trim();
  try {
    await rateLimiter.consume(ip);
  } catch {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const _gotcha = formData.get("_gotcha") as string;
    const zeitstempel = formData.get("zeitstempel") as string;

    if (_gotcha && _gotcha.trim() !== "") {
      return NextResponse.json({ success: true }, { status: 200 });
    }
    if (zeitstempel) {
      const submitTime = parseInt(zeitstempel, 10);
      if (!isNaN(submitTime) && Date.now() - submitTime < 3000) {
        return NextResponse.json({ success: true }, { status: 200 });
      }
    }

    const rawExtras = formData.getAll("extras");
    const extras = rawExtras.length > 0 ? (rawExtras as string[]) : [];

    const validated = configuratorSchema.parse({
      typ: formData.get("typ"),
      extras,
      wartung: formData.get("wartung"),
      konfiguration: formData.get("konfiguration"),
      name: formData.get("name"),
      email: formData.get("email"),
      anmerkungen: formData.get("anmerkungen") || undefined,
    });

    const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (
        ![
          "typ",
          "extras",
          "wartung",
          "konfiguration",
          "name",
          "email",
          "anmerkungen",
          "_gotcha",
          "zeitstempel",
        ].includes(key)
      ) {
        rawData[key] = value;
      }
    });

    await prisma.configuratorRequest.create({
      data: {
        typ: validated.typ,
        extras: validated.extras,
        wartung: validated.wartung,
        konfiguration: validated.konfiguration,
        name: validated.name,
        email: validated.email,
        anmerkungen: validated.anmerkungen || null,
        rawData,
        status: "new",
      },
    });

    if (resend) {
      const adminEmail =
        process.env.DEFAULT_ADMIN_EMAIL || "hallo@surhay.design";
      await resend.emails.send({
        from: "Surhay Design <onboarding@resend.dev>",
        to: adminEmail,
        subject: `Neue Konfigurator-Anfrage: ${validated.typ}`,
        html: `
          <h2>Neue Konfigurator-Anfrage</h2>
          <p><strong>Name:</strong> ${validated.name}</p>
          <p><strong>E-Mail:</strong> ${validated.email}</p>
          <p><strong>Typ:</strong> ${validated.typ}</p>
          <p><strong>Extras:</strong> ${validated.extras.join(", ") || "Keine"}</p>
          <p><strong>Wartung:</strong> ${validated.wartung}</p>
          <p><strong>Zusammenfassung:</strong> ${validated.konfiguration}</p>
          <p><strong>Anmerkungen:</strong><br/>${validated.anmerkungen || "-"}</p>
        `,
      });
    } else {
      console.warn(
        "[Configurator API] RESEND_API_KEY is missing. Email skipped, but data saved to DB.",
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation failed" },
        { status: 400 },
      );
    }
    console.error("[Configurator API Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
