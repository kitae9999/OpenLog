"use client";

import Image from "next/image";
import {
  startTransition,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AuthMode } from "@/features/auth/model/auth.type";
import { handleOAuth } from "@/features/auth/api/handleOAuth";
import { GitHubIcon } from "@/shared/ui/icons";
import { logoMarkClassName } from "@/widgets/chrome/ui/brand";
import { cn } from "@/shared/lib/cn";

type AuthContent = {
  title: string;
  description: string;
  footerLead: string;
  footerActionLabel: string;
  footerActionTarget: AuthMode;
};

export type AuthModalControls = {
  openLogin: () => void;
  openSignup: () => void;
  isModalOpen: boolean;
};

const modalButtonClassName =
  "flex h-12 w-full items-center justify-center gap-3 rounded-[14px] text-[16px] font-medium tracking-[-0.02em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20";

const authContent: Record<AuthMode, AuthContent> = {
  login: {
    title: "Welcome back",
    description:
      "Sign in to review code, suggest changes, and build your knowledge graph.",
    footerLead: "Don't have an account?",
    footerActionLabel: "Sign up",
    footerActionTarget: "signup",
  },
  signup: {
    title: "Join OpenLog",
    description: "Create an account to start contributing to the community.",
    footerLead: "Already have an account?",
    footerActionLabel: "Log in",
    footerActionTarget: "login",
  },
};

export function GuestActions({
  children,
}: {
  children?: (controls: AuthModalControls) => ReactNode;
} = {}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const titleId = useId();
  const descriptionId = useId();
  const content = authContent[authMode];

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  function openModal(mode: AuthMode = "login") {
    startTransition(() => {
      setAuthMode(mode);
      setIsModalOpen(true);
    });
  }

  function closeModal() {
    startTransition(() => {
      setIsModalOpen(false);
    });
  }

  function switchMode(nextMode: AuthMode) {
    startTransition(() => {
      setAuthMode(nextMode);
    });
  }

  const controls: AuthModalControls = {
    openLogin: () => openModal("login"),
    openSignup: () => openModal("signup"),
    isModalOpen,
  };

  return (
    <>
      {children ? (
        children(controls)
      ) : (
        <button
          type="button"
          onClick={controls.openLogin}
          aria-haspopup="dialog"
          aria-expanded={isModalOpen}
          className="inline-flex h-9 items-center rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          Log in
        </button>
      )}

      {isModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[80] grid place-items-center p-4">
              <button
                type="button"
                aria-label={`Close ${authMode} modal`}
                onClick={closeModal}
                className="absolute inset-0 bg-zinc-950/12 backdrop-blur-[10px] backdrop-saturate-150"
              />

              <AuthDialog
                authMode={authMode}
                content={content}
                titleId={titleId}
                descriptionId={descriptionId}
                onClose={closeModal}
                onSwitchMode={switchMode}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function AuthDialog({
  authMode,
  content,
  titleId,
  descriptionId,
  onClose,
  onSwitchMode,
}: {
  authMode: AuthMode;
  content: AuthContent;
  titleId: string;
  descriptionId: string;
  onClose: () => void;
  onSwitchMode: (nextMode: AuthMode) => void;
}) {
  return (
    <div className="relative z-10 w-full max-w-[450px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full overflow-hidden rounded-2xl border border-[#f3f4f6] bg-white p-8 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]"
      >
        <button
          type="button"
          aria-label={`Dismiss ${authMode} modal`}
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full text-[#98a2b3] transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <IconClose className="size-5" />
        </button>

        <div className="flex flex-col items-center gap-8 pt-3">
          {/* 로고 + description */}
          <div className="flex w-full max-w-[382px] flex-col items-center">
            <div
              className={cn(
                "grid size-12 place-items-center rounded-[14px] bg-black text-[24px] text-white",
                logoMarkClassName,
              )}
            >
              O
            </div>

            <h2
              id={titleId}
              className="mt-4 text-center text-[24px] leading-8 text-[#101828]"
            >
              {content.title}
            </h2>

            <p
              id={descriptionId}
              className="mt-2 max-w-[360px] text-center text-[14px] leading-5 tracking-[-0.01em] text-[#6a7282]"
            >
              {content.description}
            </p>
          </div>

          {/*oauth provider 선택 섹션*/}
          <div className="flex w-full max-w-[382px] flex-col gap-3">
            <button
              type="button"
              autoFocus
              onClick={() => handleOAuth("GOOGLE")}
              className={`${modalButtonClassName} border border-[#e5e7eb] bg-white text-[#364153] hover:bg-zinc-50`}
            >
              <Image
                src="/google.svg"
                alt=""
                width={20}
                height={20}
                aria-hidden="true"
                className="size-5"
              />
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuth("GITHUB")}
              className={`${modalButtonClassName} bg-[#24292f] text-white hover:bg-[#1b2027]`}
            >
              <GitHubIcon className="size-5" />
              Continue with GitHub
            </button>
          </div>

          <div className="w-full max-w-[382px] border-t border-[#f3f4f6] pt-6 text-center">
            <p className="text-[14px] leading-5 tracking-[-0.01em] text-[#4a5565]">
              {content.footerLead}{" "}
              <button
                type="button"
                onClick={() => onSwitchMode(content.footerActionTarget)}
                className="font-bold leading-6 text-black transition hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                {content.footerActionLabel}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 6l8 8M14 6l-8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
