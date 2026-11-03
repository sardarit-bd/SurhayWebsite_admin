import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(new URL("/login", request.url));
}
