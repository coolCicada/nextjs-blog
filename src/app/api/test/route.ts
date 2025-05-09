import { sql } from '@/app/db'
export async function GET() {
    const r = await sql`SELECT * FROM matches`;
    return Response.json(r)
  }