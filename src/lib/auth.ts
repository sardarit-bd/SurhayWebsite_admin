import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  isAdmin: boolean;
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), {
    password: process.env.SESSION_PASSWORD!,
    cookieName: "surhay_admin_session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  });
}
