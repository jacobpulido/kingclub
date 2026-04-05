import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(, "El correo es requerido")
    .email("Correo electrónico inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z
      .string()
      .min(1, "El correo es requerido")
      .email("Correo electrónico inválido"),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "El correo es requerido")
    .email("Correo electrónico inválido"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
