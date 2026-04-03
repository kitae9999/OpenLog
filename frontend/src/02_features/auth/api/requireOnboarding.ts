import { redirect } from "next/navigation";
import { getUser } from "@/features/auth/api/getUser";

export async function getUserOrRedirectToOnboarding() {
  const user = await getUser();

  if (user && !user.isOnboardingComplete) {
    redirect("/onboarding");
  }

  return user;
}

export async function getIncompleteUserOrRedirectHome() {
  const user = await getUser();

  if (!user || user.isOnboardingComplete) {
    redirect("/");
  }

  return user;
}
