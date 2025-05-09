import postgres from 'postgres';
import { Game } from '../matches/components/games';
export const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const getAllUsers = async () => {
    return await sql`SELECT * FROM users`;
}

const getAllMatches = async () => {
    return await sql<Game[]>`SELECT * FROM matches`;
}

export {
    getAllUsers,
    getAllMatches
}