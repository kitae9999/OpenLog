"use client";

import Image from "next/image";
import { useActionState, useEffect, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import type { User } from "@/entities/user/model/User";
import {
  submitOnboarding,
  type OnboardingActionState,
} from "@/app/onboarding/actions";

const USERNAME_PATTERN = /^[a-z0-9]+$/;

type FieldName = "nickname" | "username" | "bio";

export function OnboardingView({ user }: { user: User }) {
  const initialState: OnboardingActionState = {
    values: {
      nickname: user.nickname ?? "",
      username: user.username ?? "",
      bio: user.bio ?? "",
    },
    errors: {},
  };
  const [actionState, formAction] = useActionState(
    submitOnboarding,
    initialState,
  );
  const [values, setValues] = useState(actionState.values);
  const [clientErrors, setClientErrors] = useState<
    Partial<Record<FieldName, string>>
  >({});
  const [serverErrors, setServerErrors] = useState(actionState.errors);

  useEffect(() => {
    setValues(actionState.values);
    setServerErrors(actionState.errors);
  }, [actionState]);

  function validateField(name: FieldName, value: string) {
    if (name === "nickname") {
      if (!value.trim()) {
        return "닉네임은 필수입니다.";
      }
      if (value.trim().length > 40) {
        return "닉네임은 40자 이하로 입력해주세요.";
      }
      return undefined;
    }

    if (name === "username") {
      const trimmed = value.trim();

      if (!trimmed) {
        return "username은 필수입니다.";
      }
      if (trimmed.length < 3 || trimmed.length > 20) {
        return "username은 3자 이상 20자 이하로 입력해주세요.";
      }
      if (!USERNAME_PATTERN.test(trimmed)) {
        return "username은 영어 소문자와 숫자만 사용할 수 있습니다.";
      }
      return undefined;
    }

    if (value.trim().length > 160) {
      return "bio는 160자 이하로 입력해주세요.";
    }

    return undefined;
  }

  function handleFieldChange(name: FieldName, nextValue: string) {
    setValues((current) => ({
      ...current,
      [name]: nextValue,
    }));

    setClientErrors((current) => ({
      ...current,
      [name]: undefined,
    }));

    setServerErrors((current) => ({
      ...current,
      [name]: undefined,
      form: undefined,
    }));
  }

  function handleFieldBlur(name: FieldName) {
    const nextError = validateField(name, values[name]);

    setClientErrors((current) => ({
      ...current,
      [name]: nextError,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const nextErrors: Partial<Record<FieldName, string>> = {
      nickname: validateField("nickname", values.nickname),
      username: validateField("username", values.username),
      bio: validateField("bio", values.bio),
    };

    setClientErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      event.preventDefault();
    }
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4">
      <div className="absolute inset-0 bg-zinc-950/12 backdrop-blur-[10px] backdrop-saturate-150" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="relative z-10 w-full max-w-[520px] overflow-hidden rounded-2xl border border-[#f3f4f6] bg-white p-8 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]"
      >
        <div className="flex flex-col items-center gap-8 pt-3">
          <div className="flex w-full max-w-[382px] flex-col items-center">
            <div className="grid size-12 place-items-center rounded-[14px] bg-black text-[24px] font-bold leading-none text-white [font-family:Georgia,serif]">
              O
            </div>

            <h1
              id="onboarding-title"
              className="mt-4 text-center text-[24px] leading-8 text-[#101828] [font-family:Georgia,serif]"
            >
              Welcome.
            </h1>

            <p className="mt-2 max-w-[360px] text-center text-[14px] leading-5 tracking-[-0.01em] text-[#6a7282]">
              OpenLog에서 사용할 프로필 정보를 먼저 완성해 주세요.
            </p>
            <p className="mt-1 max-w-[360px] break-all text-center text-[13px] leading-5 tracking-[-0.01em] text-[#98a2b3]">
              {user.email ?? "OpenLog member"}
            </p>
          </div>

          <form
            action={formAction}
            onSubmit={handleSubmit}
            className="flex w-full max-w-[382px] flex-col gap-5"
          >
            <Field
              name="nickname"
              label="Nickname"
              value={values.nickname}
              placeholder="프로필과 활동 영역에 표시되는 이름입니다."
              description=""
              error={clientErrors.nickname ?? serverErrors.nickname}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
            />

            <Field
              name="username"
              label="Username"
              value={values.username}
              placeholder="영어 소문자와 숫자만 사용할 수 있으며, 중복될 수 없습니다."
              description=""
              error={clientErrors.username ?? serverErrors.username}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
            />

            <Field
              name="bio"
              label="Bio"
              value={values.bio}
              placeholder="What do you like to write about?"
              description=""
              error={clientErrors.bio ?? serverErrors.bio}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              multiline
            />

            {serverErrors.form ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {serverErrors.form}
              </p>
            ) : null}

            <div className="pt-1">
              <SubmitButton />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  value,
  placeholder,
  description,
  error,
  onChange,
  onBlur,
  multiline = false,
}: {
  name: FieldName;
  label: string;
  value: string;
  placeholder: string;
  description: string;
  error?: string;
  onChange: (name: FieldName, value: string) => void;
  onBlur: (name: FieldName) => void;
  multiline?: boolean;
}) {
  const commonClassName =
    "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-200/70";
  const resolvedClassName = error
    ? `${commonClassName} border-rose-300 bg-rose-50/40 focus:border-rose-400 focus:ring-rose-100`
    : `${commonClassName} border-zinc-200`;

  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-900">{label}</span>
      {multiline ? (
        <textarea
          name={name}
          value={value}
          placeholder={placeholder}
          rows={5}
          maxLength={160}
          className={`${resolvedClassName} mt-2 min-h-[124px] resize-none`}
          onChange={(event) => onChange(name, event.target.value)}
          onBlur={() => onBlur(name)}
        />
      ) : (
        <input
          name={name}
          value={value}
          placeholder={placeholder}
          maxLength={name === "nickname" ? 40 : 20}
          autoCapitalize="none"
          autoCorrect="off"
          className={resolvedClassName}
          onChange={(event) => onChange(name, event.target.value)}
          onBlur={() => onBlur(name)}
        />
      )}

      <p className={`mt-2 text-sm ${error ? "text-rose-600" : "text-zinc-500"}`}>
        {error ?? description}
      </p>
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center rounded-[14px] bg-zinc-950 px-6 text-[16px] font-medium tracking-[-0.02em] text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? "Saving..." : "시작하기"}
    </button>
  );
}
