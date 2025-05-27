import { deleteMatchById, getMatchById } from "@/app/db/matches";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const r = await getMatchById(id);
  return Response.json(r);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deleteMatchById(id);
    return Response.json({ msg: "success", data: null,  });
  } catch (error) {
    return Response.json({ msg: error, data: null });
  }
}
