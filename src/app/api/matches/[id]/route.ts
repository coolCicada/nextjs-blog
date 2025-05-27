import { getMatchById } from "@/app/db/matches";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const r = await getMatchById(id);
  return Response.json(r);
}
