import { redirect } from "next/navigation";

/** Status page is not ready — block navigation for now. */
export default function StatusPage() {
  redirect("/");
}
