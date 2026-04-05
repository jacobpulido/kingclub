"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/schemas/auth";
export async function login(formData: LoginInput) {
  const supabase = await createClient();
  const result = loginSchema.safeParse(formData);
  if (!result.success) {
    return { error: "Datos inválidos" };
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  redirect("/member/dashboard");
}