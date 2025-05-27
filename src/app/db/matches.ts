
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
    if (!item.id) {
        return null
    }
    return await sql`UPDATE matches SET match_name = ${item.match_name}, match_time = ${item.match_time} WHERE id = ${item.id}`
}

const addOneMatch = async (item: Game) => {
    return await sql`INSERT INTO matches (match_name, match_time) VALUES (${item.match_name}, ${item.match_time})`
}

export {
    getAllUsers,
    getAllMatches,
    getMatchById,
    editMatch,
    addOneMatch
}