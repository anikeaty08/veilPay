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
  organizationSlug: z.string().trim().min(1).max(40).default("default-org"),
  organizationName: z.string().trim().min(1).max(80),
  teamName: z.string().trim().min(1).max(60).default("Operations"),
  costCenter: z.string().trim().min(1).max(60).default("Treasury"),
  label: z.string().trim().min(1).max(96),
  category: z.string().trim().min(1).max(40),
  dueDate: z.number().int().nonnegative(),
  settlementToken: addressSchema,
  kind: z.number().int().min(0).max(4),
  tokenDecimals: z.number().int().min(0).max(18).default(6),
  currencySymbol: z.string().trim().min(1).max(12).default("USDC"),
  requiredApprovals: z.number().int().min(1).max(10).default(1),
  approvalCount: z.number().int().min(0).max(10).default(0),
  workflowStatus: z
    .enum(["drafted", "needs_review", "ready", "shared", "completed", "cancelled"])
    .default("needs_review"),
  assignedReviewer: addressSchema.optional(),
  disclosureSharedWith: z.array(addressSchema).default([]),
  tags: z.array(z.string().trim().min(1).max(24)).max(8).default([]),
  latestAction: z.string().trim().min(1).max(40).default("created"),
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

export const payoutActivitySchema = z.object({
  payoutId: z.number().int().positive(),
  actor: addressSchema,
  action: z.enum([
    "created",
    "approved",
    "marked_ready",
    "revealed",
    "claimed",
    "shared_disclosure",
    "refreshed",
  ]),
  organizationSlug: z.string().trim().min(1).max(40).default("default-org"),
  note: z.string().trim().max(140).optional(),
  target: addressSchema.optional(),
  createdAt: z.string().datetime(),
});

export const payoutWorkflowUpdateSchema = z.object({
  payoutId: z.number().int().positive(),
  actor: addressSchema,
  action: payoutActivitySchema.shape.action,
  note: z.string().trim().max(140).optional(),
  target: addressSchema.optional(),
  workflowStatus: payoutMetadataSchema.shape.workflowStatus.optional(),
  incrementApprovalCount: z.boolean().optional(),
  addDisclosureViewer: addressSchema.optional(),
});

export type PayoutMetadata = z.infer<typeof payoutMetadataDocumentSchema>;
export type PayoutActivity = z.infer<typeof payoutActivitySchema>;
