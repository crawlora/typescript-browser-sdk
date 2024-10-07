import { z } from 'zod';

export const ZProxy = z.object({
    host: z.string(), // can be host or ipv4/6 address
    protocol: z.enum(['socks4', 'socks5', 'http', 'https']).optional().default('http'),
    port: z.number(),
    credential: z
        .object({
            user_name: z.string(),
            password: z.string(),
        })
        .optional(),
});