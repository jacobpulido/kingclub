"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Check if the current user is an admin
 * Returns the user if admin, null if not authenticated, redirects if member
 */
export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login" as any);
  }

  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login" as any);
  }

  if (profile.role !== "admin") {
    redirect("/member/dashboard" as any);
  }

  return {
    id: user.id,
    email: user.email!,
    full_name: profile.full_name,
    role: profile.role,
  };
}

/**
 * Check if current user is admin without redirecting
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}

/**
 * Get current admin user info
 */
export async function getCurrentAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return null;
  }

  return {
    id: user.id,
    email: user.email!,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
  };
}
