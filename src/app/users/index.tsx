export const dynamic = 'force-dynamic';

import { getAllUsers } from '@/app/db/matches'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  

export default async function User() {
    const r = await getAllUsers();
    return (
        <div>
            <Table>
                <TableCaption>积分展示</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">序号</TableHead>
                        <TableHead>姓名</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {r.map((item, index) => {
                        return (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell>{item.name}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}