import * as z from "zod";

export const validationSchema = z.string().min(8).max(8);

export type ValidationType = z.infer<typeof validationSchema>;
