
import { sql } from '@/app/db'
export async function GET() {
    await new Promise(r => {
      setTimeout(r, 5000);
    });
    const r = await sql`SELECT * FROM matches`;
    return Response.json(r)
  }