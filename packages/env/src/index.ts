import { z } from "zod";

export const publicWebEnvShape = {
  NEXT_PUBLIC_APP_URL: z.string().url()
};

type EnvSource = Record<string, string | undefined>;

export function parseEnv<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  source: EnvSource = process.env
) {
  return schema.parse(source) as z.infer<TSchema>;
}
