
import { sql } from '@/app/db'
export async function GET() {
    const r = await sql`SELECT * FROM customers`;
    return Response.json({ message: r })
  }
