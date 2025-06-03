import { getAllTags } from "@/app/db/tags";
import { withHandler } from "../utils";


export const GET = withHandler(async () => {
  return await getAllTags();
})
