import { PostDraftFixtureView } from "./PostDraftFixtureView";

export default async function PostDraftFixturePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;

  return (
    <>
      {saved === "draft" ? (
        <p role="status" className="sr-only">
          Draft saved on server
        </p>
      ) : null}
      <PostDraftFixtureView />
    </>
  );
}
