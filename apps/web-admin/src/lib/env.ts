import { parseEnv } from "@barberpro/env";
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_ADMIN_URL: z.string().url()
});

export const env = parseEnv(envSchema);
