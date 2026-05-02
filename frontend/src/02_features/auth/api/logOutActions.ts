"use server";

import { API_CONFIG } from "@/shared/api";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ACCESS_TOKEN_COOKIE_NAME = "openlog_access_token";

export async function logOut() {
  const response = await fetch(`${API_CONFIG.baseURL}/auth/logout`, {
    method: "POST",
    cache: "no-store",
  });

  if (response.ok) {
    const cookieStore = await cookies();
    cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME);
    redirect("/");
  }
}
