import { sql } from '@/app/db'

export const dynamic = 'force-dynamic'

export default async function User() {
    const r = await sql`SELECT * FROM customers`;
    return (
        <div>
            {r.map(item => {
                return (
                    <div key={item.name}>
                        <span>{item.name}</span>
                        <span>{item.email}</span>
                    </div>
                )
            })}
        </div>
    )
}