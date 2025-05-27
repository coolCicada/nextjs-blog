import { sql } from "@/app/db";
import { addOneMatch, editMatch } from "@/app/db/matches";
import { NextRequest } from "next/server";

export async function GET() {
  const r = await sql`SELECT * FROM matches`;
  return Response.json(r);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.id) {
      await editMatch(body);
    } else {
      await addOneMatch(body);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return Response.json({
      msg: "error",
      data: null,
    });
  }
  return Response.json({
    msg: "success",
    data: null,
  });
}
