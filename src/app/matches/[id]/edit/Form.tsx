'use client';
import { Input } from "@/components/ui/input";
import DateTimePickerC from './components/datetime-picker';
import { Game } from "../../components/games";
import { use, useState } from "react";
import { Button } from '@/components/ui/button';
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
    id: z.string(),
    match_name: z.string().min(2, {
        message: "至少输入2个字符",
    }),
    match_time: z.date(),
})

const FormC = ({ formPromise }: { formPromise: Promise<Game | null> }) => {
    const r = use(formPromise);
    const [loading, setLoading] = useState(false);
    const router = useRouter()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            match_name: r?.match_name,
            match_time: r?.match_time,
            id: r?.id
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        const response = await fetch(`/api/matches/${values.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });
        const res = await response.json();
        if (res.msg === 'success') {
            router.back();
            setTimeout(() => {
                router.refresh();
            }, 100);
        } else {
            alert(res.msg)
        }
        setLoading(false);
    }

    return (
        <div className="flex flex-1 flex-col overflow-auto">
            <Form {...form}>
                <form id="match-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 overflow-auto flex-1">
                    <FormField
                        control={form.control}
                        name="match_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>比赛名称</FormLabel>
                                <FormControl>
                                    <Input placeholder="请输入比赛名称" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="match_time"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>比赛时间</FormLabel>
                                <FormControl>
                                    <DateTimePickerC {...field} />
                                </FormControl>
                                <FormDescription>
                                    时区为当地时区
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </form>
                <Button form="match-form" type="submit" disabled={loading}>提交</Button>
            </Form>
        </div>
    )
}

export default FormC;