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

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/member/dashboard");
}

export async function register(formData: RegisterInput) {
  const supabase = await createClient();

  const result = registerSchema.safeParse(formData);
  if (!result.success) {
    return { error: "Datos inválidos" };
  }

  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName,
        phone: formData.phone,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPassword(formData: ForgotPasswordInput) {
  const supabase = await createClient();

  const result = forgotPasswordSchema.safeParse(formData);
  if (!result.success) {
    return { error: "Correo inválido" };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.email,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    }
  );

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function resetPassword(formData: ResetPasswordInput, code: string) {
  const supabase = await createClient();

  const result = resetPasswordSchema.safeParse(formData);
  if (!result.success) {
    return { error: "Datos inválidos" };
  }

  // Exchange the code for a session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  
  if (exchangeError) {
    return { error: "Código de recuperación inválido o expirado" };
  }

  const { error } = await supabase.auth.updateUser({
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  // Get profile data including role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    ...user,
    profile,
  };
}

export async function getUserRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role || "member";
}
