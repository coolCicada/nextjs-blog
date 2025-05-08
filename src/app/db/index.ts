import postgres from 'postgres';
export const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const getAllUsers = async () => {
    return await sql`SELECT * FROM users`;
}

export {
    getAllUsers
}