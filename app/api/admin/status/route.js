import { NextResponse } from "next/server";
import { isAdminAuthed } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ isAdmin: isAdminAuthed() });
}
