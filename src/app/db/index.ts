import postgres from 'postgres';
import { Game } from '../matches/components/games';
export const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const getAllUsers = async () => {
    return await sql`SELECT * FROM users`;
}

const getAllMatches = async () => {
    return await sql<Game[]>`SELECT * FROM matches`;
}

const getMatchById = async (id: string) => {
    try {
        const res = await sql<Game[]>`SELECT * FROM matches WHERE id = ${id}`;
        return res[0];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return null;    
    }
}

export {
    getAllUsers,
    getAllMatches,
    getMatchById
}