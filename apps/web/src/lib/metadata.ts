import { z } from "zod";

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/)
  .transform((value) => value.toLowerCase());

const metadataHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/)
  .transform((value) => value.toLowerCase());

const optionalUrlSchema = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .pipe(z.string().url().optional())
  .optional();

const optionalReferenceSchema = z
  .string()
  .trim()
  .max(96)
  .transform((value) => value || undefined)
  .optional();

export const payoutMetadataSchema = z.object({
  payoutId: z.number().int().positive().optional(),
  batchId: z.number().int().positive().optional(),
  metadataHash: metadataHashSchema,
  creator: addressSchema,
  recipient: addressSchema,
  organizationName: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(96),
  category: z.string().trim().min(1).max(40),
  dueDate: z.number().int().nonnegative(),
  settlementToken: addressSchema,
  kind: z.number().int().min(0).max(4),
  tokenDecimals: z.number().int().min(0).max(18).default(6),
  currencySymbol: z.string().trim().min(1).max(12).default("USDC"),
  attachmentUrl: optionalUrlSchema,
  reference: optionalReferenceSchema,
});

export const payoutMetadataUpsertSchema = z.object({
  items: z.array(payoutMetadataSchema).min(1),
});

export const payoutMetadataDocumentSchema = payoutMetadataSchema.extend({
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type PayoutMetadata = z.infer<typeof payoutMetadataDocumentSchema>;
