import { redirect } from "next/navigation";

/** Privacy page is not ready — block navigation for now. */
export default function PrivacyPage() {
  redirect("/");
}
