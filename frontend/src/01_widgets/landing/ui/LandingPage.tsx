"use client";

import Image from "next/image";
import Link from "next/link";
import { Geist_Mono } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import { GuestActions } from "@/features/auth/ui";
import { handleOAuth } from "@/features/auth/api/handleOAuth";
import { cn } from "@/shared/lib/cn";
import { OpenLogLogo } from "@/shared/ui/brand";
import { GitHubIcon } from "@/shared/ui/icons";
import { LandingGraphDemo } from "./LandingGraphDemo";
import { LandingSessionDemo } from "./LandingSessionDemo";
import { LandingTerminalDemo } from "./LandingTerminalDemo";
import { LandingWorkflowStory } from "./LandingWorkflowStory";
import {
  useActiveSection,
  usePrefersReducedMotion,
  useRevealOnce,
  useScrolledPast,
  useScrollProgress,
} from "./useLandingScroll";
import "./landing.css";

const landingMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-landing-mono",
  display: "swap",
});

const sectionIds = [
  "session",
  "pipeline",
  "contribute",
  "features",
  "graph",
] as const;

const navLinks = [
  { href: "#session", label: "Session", id: "session" },
  { href: "#pipeline", label: "Pipeline", id: "pipeline" },
  { href: "#contribute", label: "Contribute", id: "contribute" },
  { href: "#features", label: "Features", id: "features" },
  { href: "#graph", label: "Graph", id: "graph" },
] as const;

const heroLines = [
  ["Work", "first."],
  ["Writing", "follows."],
] as const;

const contributeSteps = [
  {
    step: "01",
    title: "Share a knowledge post",
    body: "Turn connected tasks and logs into a post the community can read.",
  },
  {
    step: "02",
    title: "Receive edit suggestions",
    body: "Readers propose clearer wording, missing context, or better structure.",
  },
  {
    step: "03",
    title: "Accept what fits",
    body: "You stay in control — review suggestions and keep the final voice yours.",
  },
] as const;

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [heroReady, setHeroReady] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const progress = useScrollProgress();
  const navScrolled = useScrolledPast(24);
  const activeSection = useActiveSection(sectionIds);

  useRevealOnce(rootRef);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHeroReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <GuestActions>
      {({ openLogin, openSignup, isModalOpen }) => (
        <div
          ref={rootRef}
          className={`${landingMono.variable} landing-root landing-body relative flex min-h-screen flex-col antialiased`}
        >
          <div
            className="landing-progress"
            style={{ transform: `scaleX(${progress})` }}
            aria-hidden="true"
          />
          <div className="landing-shader" aria-hidden="true" />

          <nav
            className={cn(
              "fixed top-0 z-50 w-full border-b transition-all duration-300",
              navScrolled
                ? "border-zinc-200/70 bg-white/90 shadow-[0_8px_30px_-20px_rgba(0,0,0,0.35)] backdrop-blur-md"
                : "border-transparent bg-white",
            )}
          >
            <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between px-6">
              <Link
                href="/"
                className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                <OpenLogLogo className="w-[136px]" priority sizes="136px" />
              </Link>

              <div className="hidden items-center gap-6 md:flex">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "landing-nav-link text-sm font-medium transition-colors duration-200",
                      activeSection === link.id
                        ? "is-active text-black"
                        : "text-[#47464a] hover:text-black",
                    )}
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={openLogin}
                  aria-haspopup="dialog"
                  aria-expanded={isModalOpen}
                  className="hidden text-sm font-medium text-[#47464a] transition-colors hover:text-black sm:block"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={openSignup}
                  aria-haspopup="dialog"
                  aria-expanded={isModalOpen}
                  className="landing-mono landing-cta-primary rounded-full bg-black px-4 py-2 text-[11px] tracking-wider text-white uppercase hover:bg-zinc-800"
                >
                  Get started
                </button>
              </div>
            </div>
          </nav>

          <main className="relative z-10 flex-grow pt-32 pb-32">
            <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 pt-16 pb-28">
              <div
                className={cn(
                  "z-10 mx-auto max-w-5xl space-y-10 text-center",
                  heroReady || reducedMotion ? "landing-hero-ready" : null,
                )}
              >
                <h1 className="landing-hero-title text-black">
                  {heroLines.map((line, lineIndex) => (
                    <span key={line.join("-")} className="block">
                      {line.map((word, wordIndex) => {
                        const index =
                          heroLines
                            .slice(0, lineIndex)
                            .reduce(
                              (count, previousLine) =>
                                count + previousLine.length,
                              0,
                            ) + wordIndex;
                        return (
                          <span key={`${lineIndex}-${word}`}>
                            <span
                              className="landing-hero-word"
                              style={{ ["--i" as string]: index }}
                            >
                              {word}
                            </span>
                            {wordIndex < line.length - 1 ? " " : null}
                          </span>
                        );
                      })}
                    </span>
                  ))}
                </h1>

                <p
                  className="landing-stagger-child mx-auto max-w-2xl text-xl font-light text-[#47464a]"
                  style={{ ["--i" as string]: 4 }}
                >
                  OpenLog captures your development workflow context
                  automatically, connecting tasks, logs, and decisions into
                  publish-ready documentation.
                </p>

                <div
                  className="landing-stagger-child flex flex-col items-center justify-center gap-6 sm:flex-row sm:items-center"
                  style={{ ["--i" as string]: 5 }}
                >
                  <button
                    type="button"
                    onClick={openSignup}
                    aria-haspopup="dialog"
                    aria-expanded={isModalOpen}
                    className="landing-mono landing-cta-primary flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-black px-8 text-[12px] tracking-wider text-white uppercase hover:bg-zinc-800 sm:w-auto"
                  >
                    Start writing
                    <span aria-hidden="true">→</span>
                  </button>
                  <div className="relative flex h-[50px] w-full items-center justify-center sm:w-auto">
                    <Link
                      href="/?tab=explore"
                      className="landing-mono flex h-full w-full items-center justify-center px-8 text-center text-[12px] tracking-wider text-[#47464a] uppercase transition-colors hover:text-black sm:w-auto"
                    >
                      Explore posts
                    </Link>
                    <div
                      className="landing-speech-bubble absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 whitespace-nowrap"
                      role="note"
                    >
                      No login needed
                      <span
                        className="landing-speech-bubble-tail"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section
              id="session"
              className="relative border-y border-zinc-200/60 py-24 sm:py-28"
            >
              <div className="landing-reveal mx-auto mb-12 max-w-5xl px-6 text-center">
                <h2 className="landing-display text-4xl leading-[1.1] font-bold tracking-tight text-black lg:text-5xl">
                  A session becomes a draft
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-lg font-light text-[#47464a]">
                  Watch Claude Code talk through the work while OpenLog captures
                  the task, logs, and links in the workspace.
                </p>
              </div>
              <div className="landing-reveal mx-auto max-w-[1280px] px-4 sm:px-6">
                <LandingSessionDemo />
              </div>
            </section>

            <section id="pipeline" className="relative py-28">
              <div className="landing-reveal mx-auto mb-14 max-w-5xl px-6">
                <h2 className="landing-display text-4xl leading-[1.1] font-bold tracking-tight text-black lg:text-5xl">
                  The Workflow Loop
                </h2>
                <p className="mt-5 max-w-2xl text-lg font-light text-[#47464a]">
                  Hover a step to see what it looks like in practice.
                </p>
              </div>
              <div className="landing-reveal mx-auto max-w-5xl px-6">
                <LandingWorkflowStory />
              </div>
            </section>

            <section id="contribute" className="relative py-40">
              <div className="landing-reveal mx-auto max-w-5xl px-6">
                <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-24">
                  <div>
                    <h2 className="landing-display text-4xl leading-[1.1] font-bold tracking-tight text-black lg:text-5xl">
                      Publish is not the end
                    </h2>
                    <p className="mt-6 text-lg leading-relaxed font-light text-[#47464a]">
                      Once a post is public, other developers can send edit
                      suggestions — the same way open-source reviews improve
                      code.
                    </p>
                  </div>

                  <ol className="space-y-10 border-l border-zinc-200 pl-8">
                    {contributeSteps.map((step, index) => (
                      <li
                        key={step.step}
                        className="landing-stagger-child"
                        style={{ ["--i" as string]: index }}
                      >
                        <p className="landing-mono text-[11px] tracking-widest text-zinc-400">
                          {step.step}
                        </p>
                        <h3 className="landing-display mt-2 text-xl font-bold text-black">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed font-light text-zinc-500">
                          {step.body}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </section>

            <section id="features" className="relative py-40">
              <div className="landing-reveal mx-auto max-w-6xl px-6">
                <div className="grid grid-cols-1 items-start gap-16 lg:grid-cols-2 lg:gap-20">
                  <div>
                    <h2 className="landing-display text-4xl leading-[1.1] font-bold tracking-tight text-black lg:text-5xl">
                      Terminal-first context tracking
                    </h2>
                    <p className="mt-6 text-lg leading-relaxed font-light text-[#47464a]">
                      Logging starts when you run a command. Capture work
                      context from the terminal, or write it by hand when you
                      need to.
                    </p>
                    <ul className="mt-10 space-y-5 text-[15px] leading-relaxed text-[#47464a]">
                      <li
                        className="landing-stagger-child"
                        style={{ ["--i" as string]: 0 }}
                      >
                        <span className="font-medium text-black">
                          CLI capture.
                        </span>{" "}
                        Commit, push, and debug sessions become logs without
                        leaving the shell.
                      </li>
                      <li
                        className="landing-stagger-child"
                        style={{ ["--i" as string]: 1 }}
                      >
                        <span className="font-medium text-black">
                          Manual notes.
                        </span>{" "}
                        Decisions and issues you type yourself stay linked to
                        the same tasks.
                      </li>
                    </ul>
                  </div>

                  <div
                    className="landing-stagger-child"
                    style={{ ["--i" as string]: 2 }}
                  >
                    <LandingTerminalDemo />
                  </div>
                </div>
              </div>
            </section>

            <section id="graph" className="border-y border-zinc-200/50 py-40">
              <div className="relative mx-auto max-w-6xl px-6">
                <div className="landing-reveal relative z-10 mb-16 text-center">
                  <h2 className="landing-display text-4xl leading-[1.1] font-bold tracking-tight text-black lg:text-5xl">
                    Knowledge Graph
                  </h2>
                  <p className="mx-auto mt-6 max-w-2xl text-lg font-light text-[#47464a]">
                    Pan, zoom, and drag nodes — the same interactive graph you
                    use in your workspace.
                  </p>
                </div>

                <div className="landing-reveal landing-stagger-1 relative z-10">
                  <LandingGraphDemo />
                </div>
              </div>
            </section>

            <section className="relative overflow-hidden border-t border-zinc-200/50 py-40">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-white" />
              <div className="landing-reveal relative z-10 mx-auto max-w-4xl px-6 text-center">
                <h2 className="landing-display mb-8 text-5xl leading-[1.05] font-bold tracking-tight text-black lg:text-6xl">
                  Ready to log your work?
                </h2>
                <p className="mx-auto mb-16 max-w-2xl text-xl font-light text-zinc-500">
                  Join developers building in public and tracking their
                  knowledge as they work.
                </p>
                <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleOAuth("GITHUB")}
                    className="landing-mono landing-cta-primary flex w-full items-center justify-center gap-3 rounded-full bg-black px-10 py-5 text-[12px] tracking-wider text-white uppercase hover:bg-zinc-800 sm:w-auto"
                  >
                    <GitHubIcon className="h-5 w-5" />
                    Continue with GitHub
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuth("GOOGLE")}
                    className="landing-mono landing-cta-primary flex w-full items-center justify-center gap-3 rounded-full border border-zinc-300 bg-white px-10 py-5 text-[12px] tracking-wider text-black uppercase hover:bg-zinc-50 sm:w-auto"
                  >
                    <Image
                      src="/google.svg"
                      alt=""
                      width={20}
                      height={20}
                      aria-hidden="true"
                      className="h-5 w-5"
                    />
                    Continue with Google
                  </button>
                </div>
                <p className="landing-mono mt-8 text-[11px] tracking-widest text-zinc-400 uppercase">
                  Free for personal use. No credit card required.
                </p>
              </div>
            </section>
          </main>

          <footer className="relative z-10 w-full border-t border-zinc-200/50 bg-white py-24">
            <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-16 px-6 md:grid-cols-4">
              <div className="col-span-1 md:col-span-2">
                <div className="mb-8 opacity-80">
                  <OpenLogLogo className="w-[132px]" sizes="132px" />
                </div>
                <p className="max-w-sm text-sm leading-relaxed font-light text-zinc-500">
                  OpenLog helps developers automatically capture context and
                  build a structured knowledge base without context switching.
                </p>
              </div>
              <div>
                <h4 className="landing-mono mb-6 text-[11px] tracking-widest text-zinc-400 uppercase">
                  Product
                </h4>
                <ul className="space-y-4 text-sm font-light text-zinc-600">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="transition-colors hover:text-black"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="landing-mono mb-6 text-[11px] tracking-widest text-zinc-400 uppercase">
                  Legal
                </h4>
                <ul className="space-y-4 text-sm font-light text-zinc-600">
                  <li>
                    <span className="text-zinc-400">Privacy Policy</span>
                  </li>
                  <li>
                    <span className="text-zinc-400">Terms of Service</span>
                  </li>
                  <li>
                    <span className="text-zinc-400">Cookie Policy</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mx-auto mt-24 flex max-w-[1280px] flex-col items-center justify-between gap-6 border-t border-zinc-200/50 px-6 pt-8 md:flex-row">
              <div className="landing-mono text-[10px] tracking-widest text-zinc-400 uppercase">
                © {new Date().getFullYear()} OpenLog. All rights reserved.
              </div>
              <div className="landing-mono flex gap-6 text-[11px] tracking-widest uppercase">
                <a
                  href="https://github.com/kitae9999/openlog"
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-400 transition-colors hover:text-black"
                >
                  GitHub
                </a>
              </div>
            </div>
          </footer>
        </div>
      )}
    </GuestActions>
  );
}
