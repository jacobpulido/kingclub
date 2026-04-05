import { z } from "zod";

export const incidentTypeEnum = z.enum([
  "shipping",
  "payment",
  "membership",
  "kit",
  "other",
]);

export const incidentStatusEnum = z.enum([
  "open",
  "in_progress",
  "resolved",
]);

export const incidentSchema = z.object({
  membership_id: z.string().uuid("ID de membresía inválido"),
  type: incidentTypeEnum,
  status: incidentStatusEnum.default("open"),
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(1000, "La descripción no puede exceder 1000 caracteres"),
  shipment_id: z.string().uuid().optional().nullable(),
  resolution_notes: z
    .string()
    .max(2000, "Las notas de resolución no pueden exceder 2000 caracteres")
    .optional()
    .nullable(),
});

export const updateIncidentSchema = z.object({
  id: z.string().uuid("ID de incidencia inválido"),
  status: incidentStatusEnum.optional(),
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(1000, "La descripción no puede exceder 1000 caracteres")
    .optional(),
  resolution_notes: z
    .string()
    .max(2000, "Las notas de resolución no pueden exceder 2000 caracteres")
    .optional()
    .nullable(),
});

export const incidentFilterSchema = z.object({
  status: incidentStatusEnum.optional(),
  type: incidentTypeEnum.optional(),
  membership_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  search: z.string().optional(),
});

export type IncidentInput = z.infer<typeof incidentSchema>;
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;
export type IncidentFilterInput = z.infer<typeof incidentFilterSchema>;
export type IncidentType = z.infer<typeof incidentTypeEnum>;
export type IncidentStatus = z.infer<typeof incidentStatusEnum>;
