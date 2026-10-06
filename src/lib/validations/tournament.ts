import { z } from "zod";

export const DivisionSchema = z.enum(["5-6", "7-9", "10-11"]);

export const MatchQuerySchema = z.object({
  division: DivisionSchema.optional(),
  stage: z.string().optional(),
});

export const PlayerQuerySchema = z.object({
  division: DivisionSchema.optional(),
  sortBy: z.enum(["goals", "assists", "rating"]).default("goals"),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type DivisionType = z.infer<typeof DivisionSchema>;
export type MatchQuery = z.infer<typeof MatchQuerySchema>;
export type PlayerQuery = z.infer<typeof PlayerQuerySchema>;
