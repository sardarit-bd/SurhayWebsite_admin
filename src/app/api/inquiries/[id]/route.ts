import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const updateSchema = z
  .object({
    status: z.enum(["new", "checked", "solved"]).optional(),
    note: z.string().max(5000).nullable().optional(),
  })
  .refine((d) => d.status !== undefined || d.note !== undefined, {
    message: "Nothing to update",
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = updateSchema.parse(await request.json());

    const updated = await prisma.inquiry.update({
      where: { id },
      data: {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.note !== undefined ? { note: body.note?.trim() || null } : {}),
      },
    });

    console.log("[API] inquiry updated:", id, body);
    return NextResponse.json({ success: true, status: updated.status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[API] inquiry update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
