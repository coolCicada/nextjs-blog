import path from 'path';
import fs from 'fs';
const markdownDir = path.join(process.cwd(), 'public');
export default function getContent(fileName: string) {
    const fullPath = path.join(markdownDir, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    return fileContents;
}