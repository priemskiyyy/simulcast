import { z } from "zod";

export const DEPLOY_STAGES = [
  "BUILDING",
  "TESTING",
  "SHIPPING",
  "LIVE",
] as const;

export const deploySchema = z.object({
  service: z.string().min(1),
  stage: z.enum(DEPLOY_STAGES),
  percent: z.number().int().min(0).max(100),
});

export type Deploy = z.infer<typeof deploySchema>;
export type DeployStage = Deploy["stage"];
