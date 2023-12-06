import { z } from "zod";

export const formSchema = z.object({
    username: z.string().max(16),
    password: z.string().min(8).regex(/.*[0-9].*/g).max(255),
});