import { z } from "zod";

export const usernameRegex = /^[a-zA-Z1-9]+$/;
export const passwordRegex = /.*[0-9].*/;

export const formSchema = z.object({
    username: z.string().min(1).max(16).regex(usernameRegex),
    password: z.string().min(8).regex(passwordRegex).max(255),
});