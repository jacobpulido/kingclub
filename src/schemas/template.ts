import { z } from "zod";

export const templateTypeEnum = z.enum([
  "payment_received",
  "payment_failed",
  "shipment_shipped",
  "shipment_delivered",
  "welcome",
  "cancellation",
]);

export const templateSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  type: templateTypeEnum,
  subject: z
    .string()
    .min(5, "El asunto debe tener al menos 5 caracteres")
    .max(200, "El asunto no puede exceder 200 caracteres"),
  content: z
    .string()
    .min(20, "El contenido debe tener al menos 20 caracteres")
    .max(5000, "El contenido no puede exceder 5000 caracteres"),
  variables: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

export const updateTemplateSchema = z.object({
  id: z.string().uuid("ID de plantilla inválido"),
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .optional(),
  subject: z
    .string()
    .min(5, "El asunto debe tener al menos 5 caracteres")
    .max(200, "El asunto no puede exceder 200 caracteres")
    .optional(),
  content: z
    .string()
    .min(20, "El contenido debe tener al menos 20 caracteres")
    .max(5000, "El contenido no puede exceder 5000 caracteres")
    .optional(),
  variables: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});

export const renderTemplateSchema = z.object({
  template_id: z.string().uuid("ID de plantilla inválido"),
  variables: z.record(z.string()),
});

export type TemplateInput = z.infer<typeof templateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type RenderTemplateInput = z.infer<typeof renderTemplateSchema>;
export type TemplateType = z.infer<typeof templateTypeEnum>;

export const DEFAULT_TEMPLATE_VARIABLES = [
  { key: "{{member_name}}", description: "Nombre del miembro" },
  { key: "{{member_email}}", description: "Correo del miembro" },
  { key: "{{membership_id}}", description: "ID de la membresía" },
  { key: "{{plan_name}}", description: "Nombre del plan" },
];

export const TEMPLATE_TYPE_VARIABLES: Record<TemplateType, Array<{ key: string; description: string }>> = {
  payment_received: [
    { key: "{{payment_amount}}", description: "Monto del pago" },
    { key: "{{payment_date}}", description: "Fecha del pago" },
    { key: "{{payment_method}}", description: "Método de pago" },
  ],
  payment_failed: [
    { key: "{{payment_amount}}", description: "Monto del pago" },
    { key: "{{failure_reason}}", description: "Razón del fallo" },
    { key: "{{retry_link}}", description: "Enlace para reintentar" },
  ],
  shipment_shipped: [
    { key: "{{tracking_number}}", description: "Número de seguimiento" },
    { key: "{{carrier}}", description: "Transportista" },
    { key: "{{tracking_link}}", description: "Enlace de seguimiento" },
    { key: "{{kit_name}}", description: "Nombre del kit" },
  ],
  shipment_delivered: [
    { key: "{{tracking_number}}", description: "Número de seguimiento" },
    { key: "{{delivered_date}}", description: "Fecha de entrega" },
    { key: "{{kit_name}}", description: "Nombre del kit" },
  ],
  welcome: [
    { key: "{{start_date}}", description: "Fecha de inicio" },
    { key: "{{dashboard_link}}", description: "Enlace al panel" },
  ],
  cancellation: [
    { key: "{{cancellation_date}}", description: "Fecha de cancelación" },
    { key: "{{end_date}}", description: "Fecha de fin" },
  ],
};
