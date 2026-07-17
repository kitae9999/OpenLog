import { API_CONFIG } from "@/shared/api";

export type ConsentChallenge = {
  challenge: string;
  clientName: string;
  callbackOrigin: string;
  scope: string;
  expiresIn: number;
  defaultPermissionProfile: "safe-write";
};

export function McpConsentForm({ challenge }: { challenge: ConsentChallenge }) {
  const action = `${API_CONFIG.baseURL.replace(/\/$/, "")}/oauth2/consent`;

  return (
    <div>
      <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-zinc-400">
        CONNECTION REQUEST
      </p>
      <h1 className="mt-3 text-[25px] font-semibold leading-tight tracking-[-0.025em]">
        {challenge.clientName}에서
        <br />
        OpenLog 연결을 요청했습니다.
      </h1>

      <dl className="mt-6 grid gap-px overflow-hidden border border-zinc-200 bg-zinc-200 text-[12.5px] sm:grid-cols-[128px_1fr]">
        <dt className="bg-zinc-50 px-3 py-3 font-medium text-zinc-500">
          클라이언트
        </dt>
        <dd className="min-w-0 bg-white px-3 py-3 font-semibold text-zinc-900">
          {challenge.clientName}
        </dd>
        <dt className="bg-zinc-50 px-3 py-3 font-medium text-zinc-500">
          콜백 출처
        </dt>
        <dd className="min-w-0 break-all bg-white px-3 py-3 font-mono text-[11.5px] text-zinc-700">
          {challenge.callbackOrigin}
        </dd>
        <dt className="bg-zinc-50 px-3 py-3 font-medium text-zinc-500">
          요청 범위
        </dt>
        <dd className="min-w-0 bg-white px-3 py-3 font-mono text-[11.5px] text-zinc-700">
          {challenge.scope}
        </dd>
      </dl>

      <form action={action} method="post" className="mt-7">
        <input type="hidden" name="challenge" value={challenge.challenge} />
        <fieldset>
          <legend className="text-[13px] font-semibold text-zinc-800">
            이 연결에 허용할 권한
          </legend>
          <div className="mt-3 grid gap-2">
            <PermissionOption
              value="read-only"
              title="read-only"
              description="OpenLog 데이터를 조회할 수 있습니다."
            />
            <PermissionOption
              value="safe-write"
              title="safe-write"
              description="조회·작성·발행을 허용하고 삭제 도구는 숨깁니다."
              defaultChecked
              recommended
            />
            <PermissionOption
              value="full"
              title="full"
              description="삭제 도구까지 허용합니다. 삭제된 데이터는 복구하기 어려울 수 있습니다."
              danger
            />
          </div>
        </fieldset>

        <p className="mt-5 text-[11.5px] leading-5 text-zinc-500">
          권한은 OpenLog 설정에서 언제든 변경하거나 즉시 해지할 수 있습니다.
          에이전트가 신고한 이름과 콜백 출처가 예상한 값인지 확인하세요.
        </p>

        <div className="mt-6 grid grid-cols-[1fr_1.35fr] gap-2">
          <button
            type="submit"
            name="decision"
            value="deny"
            className="h-11 border border-zinc-300 bg-white text-[13px] font-semibold text-zinc-700 transition hover:border-zinc-500"
          >
            거절
          </button>
          <button
            type="submit"
            name="decision"
            value="approve"
            className="h-11 bg-zinc-950 text-[13px] font-semibold text-white transition hover:bg-zinc-700"
          >
            연결 승인
          </button>
        </div>
      </form>
    </div>
  );
}

function PermissionOption({
  value,
  title,
  description,
  defaultChecked = false,
  recommended = false,
  danger = false,
}: {
  value: string;
  title: string;
  description: string;
  defaultChecked?: boolean;
  recommended?: boolean;
  danger?: boolean;
}) {
  return (
    <label
      className={`grid cursor-pointer grid-cols-[auto_1fr] gap-3 border px-3.5 py-3 transition has-[:checked]:border-zinc-950 has-[:checked]:ring-1 has-[:checked]:ring-zinc-950 ${
        danger ? "border-red-200 bg-red-50/50" : "border-zinc-200 bg-white"
      }`}
    >
      <input
        type="radio"
        name="permissionProfile"
        value={value}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 accent-zinc-950"
      />
      <span>
        <span className="flex flex-wrap items-center gap-2">
          <code className="font-mono text-[12px] font-semibold text-zinc-900">
            {title}
          </code>
          {recommended ? (
            <span className="bg-emerald-100 px-1.5 py-0.5 text-[9.5px] font-semibold text-emerald-800">
              기본 권한
            </span>
          ) : null}
          {danger ? (
            <span className="bg-red-100 px-1.5 py-0.5 text-[9.5px] font-semibold text-red-700">
              삭제 허용
            </span>
          ) : null}
        </span>
        <span
          className={`mt-1 block text-[11.5px] leading-4 ${danger ? "text-red-700" : "text-zinc-500"}`}
        >
          {description}
        </span>
      </span>
    </label>
  );
}
