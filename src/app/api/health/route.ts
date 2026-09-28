import { getDb } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  // A missing DATABASE_URL is not unhealthy — this app's data lives in the browser.
  if (!process.env.DATABASE_URL) {
    return Response.json({ ok: true, db: "not_configured" });
  }
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ ok: true, db: "ok" });
  } catch {
    return Response.json({ ok: false, db: "error" }, { status: 500 });
  }
}
