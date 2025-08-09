import * as z from "zod";

export const validationSchema = z.object({
    nim: z.string().min(8).max(8),
    nama: z.string().min(1).max(25),
});

export type ValidationType = z.infer<typeof validationSchema>;
