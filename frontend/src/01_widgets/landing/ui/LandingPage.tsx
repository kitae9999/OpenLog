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
import {
  LANDING_LOCALES,
  buildLandingHref,
  landingCopy,
  type LandingLocale,
} from "@/widgets/landing/model/landingContent";
import { getMcpGuideHref } from "@/entities/workspace/model/data";
import { LandingGraphDemo } from "./LandingGraphDemo";
import { LandingSessionDemo } from "./LandingSessionDemo";
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

const sectionIds = ["session", "graph", "publish"] as const;

export function LandingPage({
  locale = "ko",
}: {
  locale?: LandingLocale;
}) {
  const copy = landingCopy[locale];
  const heroLines = copy.hero.lines;
  const navLinks = [
    { href: "#session", label: copy.nav.session, id: "session" },
    { href: "#graph", label: copy.nav.graph, id: "graph" },
    { href: "#publish", label: copy.nav.publish, id: "publish" },
  ] as const;

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
                href={buildLandingHref(locale)}
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
                <LocaleToggle locale={locale} />
                <button
                  type="button"
                  onClick={openLogin}
                  aria-haspopup="dialog"
                  aria-expanded={isModalOpen}
                  className="hidden text-sm font-medium text-[#47464a] transition-colors hover:text-black sm:block"
                >
                  {copy.nav.signIn}
                </button>
                <button
                  type="button"
                  onClick={openSignup}
                  aria-haspopup="dialog"
                  aria-expanded={isModalOpen}
                  className="landing-mono landing-cta-primary rounded-full bg-black px-4 py-2 text-[11px] tracking-wider text-white uppercase hover:bg-zinc-800"
                >
                  {copy.nav.getStarted}
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
                  {copy.hero.subtitle}
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
                    {copy.hero.startWriting}
                    <span aria-hidden="true">→</span>
                  </button>
                  <div className="relative flex h-[50px] w-full items-center justify-center sm:w-auto">
                    <Link
                      href="/?tab=explore"
                      className="landing-mono flex h-full w-full items-center justify-center px-8 text-center text-[12px] tracking-wider text-[#47464a] uppercase transition-colors hover:text-black sm:w-auto"
                    >
                      {copy.hero.explorePosts}
                    </Link>
                    <div
                      className="landing-speech-bubble absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 whitespace-nowrap"
                      role="note"
                    >
                      {copy.hero.noLoginNeeded}
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
                  {copy.session.title}
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-lg font-light text-[#47464a]">
                  {copy.session.body}
                </p>
                <p className="mt-6">
                  <Link
                    href={
                      locale === "en"
                        ? `${getMcpGuideHref()}?lang=en`
                        : getMcpGuideHref()
                    }
                    className="landing-mono text-[12px] font-medium tracking-wider text-[#47464a] uppercase transition-colors hover:text-black"
                  >
                    {copy.session.guideCta}
                  </Link>
                </p>
              </div>
              <div className="landing-reveal mx-auto max-w-[1280px] px-4 sm:px-6">
                <LandingSessionDemo />
              </div>
            </section>

            <section id="graph" className="border-y border-zinc-200/50 py-40">
              <div className="relative mx-auto max-w-6xl px-6">
                <div className="landing-reveal relative z-10 mb-16 text-center">
                  <h2 className="landing-display text-4xl leading-[1.1] font-bold tracking-tight text-black lg:text-5xl">
                    {copy.graph.title}
                  </h2>
                  <p className="mx-auto mt-6 max-w-2xl text-lg font-light text-[#47464a]">
                    {copy.graph.body}
                  </p>
                </div>

                <div className="landing-reveal landing-stagger-1 relative z-10">
                  <LandingGraphDemo />
                </div>
              </div>
            </section>

            <section id="publish" className="relative py-40">
              <div className="landing-reveal mx-auto max-w-5xl px-6">
                <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-24">
                  <div>
                    <h2 className="landing-display text-4xl leading-[1.1] font-bold tracking-tight text-black lg:text-5xl">
                      {copy.publish.title}
                    </h2>
                    <p className="mt-6 text-lg leading-relaxed font-light text-[#47464a]">
                      {copy.publish.body}
                    </p>
                  </div>

                  <ol className="space-y-10 border-l border-zinc-200 pl-8">
                    {copy.publish.steps.map((step, index) => (
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

            <section className="relative overflow-hidden border-t border-zinc-200/50 py-40">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-white" />
              <div className="landing-reveal relative z-10 mx-auto max-w-4xl px-6 text-center">
                <h2 className="landing-display mb-8 text-5xl leading-[1.05] font-bold tracking-tight text-black lg:text-6xl">
                  {copy.cta.title}
                </h2>
                <p className="mx-auto mb-16 max-w-2xl text-xl font-light text-zinc-500">
                  {copy.cta.body}
                </p>
                <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleOAuth("GITHUB")}
                    className="landing-mono landing-cta-primary flex w-full items-center justify-center gap-3 rounded-full bg-black px-10 py-5 text-[12px] tracking-wider text-white uppercase hover:bg-zinc-800 sm:w-auto"
                  >
                    <GitHubIcon className="h-5 w-5" />
                    {copy.cta.github}
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
                    {copy.cta.google}
                  </button>
                </div>
                <p className="landing-mono mt-8 text-[11px] tracking-widest text-zinc-400 uppercase">
                  {copy.cta.freeNote}
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
                  {copy.footer.blurb}
                </p>
              </div>
              <div>
                <h4 className="landing-mono mb-6 text-[11px] tracking-widest text-zinc-400 uppercase">
                  {copy.footer.product}
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
                  {copy.footer.legal}
                </h4>
                <ul className="space-y-4 text-sm font-light text-zinc-600">
                  <li>
                    <span className="text-zinc-400">{copy.footer.privacy}</span>
                  </li>
                  <li>
                    <span className="text-zinc-400">{copy.footer.terms}</span>
                  </li>
                  <li>
                    <span className="text-zinc-400">{copy.footer.cookies}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mx-auto mt-24 flex max-w-[1280px] flex-col items-center justify-between gap-6 border-t border-zinc-200/50 px-6 pt-8 md:flex-row">
              <div className="landing-mono text-[10px] tracking-widest text-zinc-400 uppercase">
                © {new Date().getFullYear()} OpenLog. {copy.footer.rights}
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

function LocaleToggle({ locale }: { locale: LandingLocale }) {
  return (
    <div
      role="group"
      aria-label="Language"
      className="flex items-center gap-1.5 text-[12px] font-medium"
    >
      {LANDING_LOCALES.map((item, index) => (
        <span key={item.key} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span className="text-zinc-300" aria-hidden="true">
              /
            </span>
          ) : null}
          <Link
            href={buildLandingHref(item.key)}
            aria-current={locale === item.key ? "page" : undefined}
            className={cn(
              "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
              locale === item.key
                ? "font-semibold text-black"
                : "text-zinc-400 hover:text-zinc-700",
            )}
          >
            {item.label}
          </Link>
        </span>
      ))}
    </div>
  );
}
