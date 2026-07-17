import { cn } from "@/shared/lib/cn";
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
      <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-zinc-950 sm:text-[32px]">
        {challenge.clientName}에서
        <br />
        OpenLog 연결을 요청했어요
      </h1>
      <p className="mt-2 text-[14.5px] leading-6 text-zinc-500">
        클라이언트 이름과 콜백 출처가 예상한 값인지 확인한 뒤 권한을 골라요.
      </p>

      <dl className="mt-8">
        <DetailRow label="클라이언트" value={challenge.clientName} />
        <DetailRow
          label="콜백 출처"
          value={challenge.callbackOrigin}
          mono
        />
        <DetailRow label="요청 범위" value={challenge.scope} mono />
      </dl>

      <form action={action} method="post" className="mt-10">
        <input type="hidden" name="challenge" value={challenge.challenge} />
        <fieldset>
          <legend className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
            이 연결에 허용할 권한
          </legend>
          <div className="mt-3 border-y border-zinc-200">
            <PermissionOption
              value="read-only"
              title="read-only"
              description="OpenLog 데이터를 조회할 수 있어요."
            />
            <PermissionOption
              value="safe-write"
              title="safe-write"
              description="조회·작성·발행을 허용하고 삭제 도구는 숨겨요."
              defaultChecked
              recommended
            />
            <PermissionOption
              value="full"
              title="full"
              description="삭제 도구까지 허용해요. 삭제된 데이터는 복구하기 어려울 수 있어요."
              danger
            />
          </div>
        </fieldset>

        <p className="mt-5 text-[12.5px] leading-5 text-zinc-500">
          권한은 OpenLog 설정에서 언제든 바꾸거나 바로 해지할 수 있어요.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-5">
          <button
            type="submit"
            name="decision"
            value="deny"
            className="cursor-pointer text-[13px] font-medium text-zinc-400 transition hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            거절
          </button>
          <button
            type="submit"
            name="decision"
            value="approve"
            className="cursor-pointer text-[13px] font-medium text-zinc-950 transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            연결 승인
          </button>
        </div>
      </form>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 border-t border-zinc-200/80 py-3.5 first:border-t-0 sm:grid-cols-[120px_minmax(0,1fr)] sm:items-baseline sm:gap-4">
      <dt className="text-[12.5px] font-medium text-zinc-500">{label}</dt>
      <dd
        className={cn(
          "min-w-0 break-all text-[13.5px] text-zinc-950",
          mono ? "font-mono text-[12px] text-zinc-700" : "font-medium",
        )}
      >
        {value}
      </dd>
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
    <label className="grid cursor-pointer grid-cols-[auto_1fr] gap-3 border-t border-zinc-200/80 px-1 py-3.5 first:border-t-0 has-[:checked]:bg-zinc-50/70">
      <input
        type="radio"
        name="permissionProfile"
        value={value}
        defaultChecked={defaultChecked}
        className="mt-1 size-4 accent-zinc-950"
      />
      <span>
        <span className="flex flex-wrap items-center gap-2">
          <code className="font-mono text-[12.5px] font-semibold text-zinc-950">
            {title}
          </code>
          {recommended ? (
            <span className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-zinc-400">
              default
            </span>
          ) : null}
          {danger ? (
            <span className="text-[10.5px] font-medium text-rose-600">
              삭제 허용
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            "mt-1 block text-[12.5px] leading-5",
            danger ? "text-rose-600" : "text-zinc-500",
          )}
        >
          {description}
        </span>
      </span>
    </label>
  );
}
