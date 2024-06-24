import getStrFromFile from '@/utils/getStrFromFile';
export async function GET() {
  const content = getStrFromFile('1.md');
  return Response.json({ content })
}
