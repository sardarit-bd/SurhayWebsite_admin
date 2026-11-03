import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { getSession } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/db";
import { rateLimiter } from "../../../../../lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(100, "New password is too long"),
    confirmPassword: z.string().min(1, "Please confirm the new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = (request.headers.get("x-forwarded-for") || "unknown")
    .split(",")[0]
    .trim();
  try {
    await rateLimiter.consume(`change-password:${ip}`);
  } catch {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a minute." },
      { status: 429 },
    );
  }

  try {
    const body = schema.parse(await request.json());

    const admin = await prisma.admin.findUnique({
      where: { username: "admin" },
    });
    if (!admin) {
      return NextResponse.json(
        { error: "Admin user not found." },
        { status: 404 },
      );
    }

    const valid = await bcrypt.compare(
      body.currentPassword,
      admin.passwordHash,
    );
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 },
      );
    }

    if (body.newPassword === body.currentPassword) {
      return NextResponse.json(
        { error: "New password must be different from the current password." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 10);
    await prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash },
    });

    console.log("[API] admin password changed");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Validation failed" },
        { status: 400 },
      );
    }
    console.error("[API] change-password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
