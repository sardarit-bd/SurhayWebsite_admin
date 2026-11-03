import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/db";
import bcrypt from "bcrypt";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    const admin = await prisma.admin.findUnique({
      where: { username: "admin" },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin user not found in database." },
        { status: 404 },
      );
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const session = await getSession();
    session.isAdmin = true;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Auth Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
