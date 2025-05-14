import { editMatch, getMatchById } from "@/app/db/matches";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const r = await getMatchById(id);
  return Response.json(r);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    console.log('put', body);
    await editMatch({ ...body, id });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return Response.json({
        msg: 'error',
        data: null
      });
  }
  return Response.json({
    msg: 'success',
    data: null
  });
}
