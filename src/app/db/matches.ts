
import { Game } from '../matches/components/games';

import { sql } from './index'

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

const editMatch = async (item: Game) => {
    return await sql`UPDATE matches SET match_name = ${item.match_name}, match_time = ${item.match_time} WHERE id = ${item.id}`
}

export {
    getAllUsers,
    getAllMatches,
    getMatchById,
    editMatch
}