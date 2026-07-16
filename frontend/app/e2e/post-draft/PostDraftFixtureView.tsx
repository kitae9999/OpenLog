"use client";

import type { WriteActionState } from "@/app/write/action-state";
import { WriteView } from "@/widgets/write/ui/WriteView";

export function PostDraftFixtureView() {
  async function saveFixturePostDraft(
    _previousState: WriteActionState,
    formData: FormData,
  ): Promise<WriteActionState> {
    const intent = String(formData.get("intent") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();

    if (intent !== "draft" || !title || !content) {
      return {
        errors: { form: "The fixture received an invalid draft submission." },
      };
    }

    return {
      errors: {},
      redirectTo: "/e2e/post-draft?saved=draft",
    };
  }

  return (
    <WriteView
      isLoggedIn
      mode="edit"
      postStatus="DRAFT"
      action={saveFixturePostDraft}
      initialValues={{
        title: "",
        description: "",
        topics: [],
        content: "",
      }}
      draftStorageKey="openlog.e2e.post-draft"
      backHref="/e2e/output-post-lifecycle"
      backLabel="Back to output fixture"
      submitLabel="Publish"
      pendingSubmitLabel="Publishing..."
    />
  );
}
