import { sql } from "./index";

interface Tag {
  id?: string;
  name: string;
}

const getAllTags = async () => {
  return await sql<Tag[]>`SELECT * FROM tags`;
};

export type {
  Tag,
};
export { getAllTags };
