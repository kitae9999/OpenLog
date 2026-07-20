"use client";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-zinc-950 px-6 text-zinc-100">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">화면을 불러오지 못했습니다.</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          요청이 잠시 몰렸거나 서버 응답이 지연되고 있습니다. 잠시 후 다시
          시도해 주세요.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
