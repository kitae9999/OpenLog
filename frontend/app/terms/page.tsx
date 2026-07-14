import { redirect } from "next/navigation";

/** Terms page is not ready — block navigation for now. */
export default function TermsPage() {
  redirect("/");
}
