import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { dim } from "./cli-ui.js";

export type PromptIo = {
  question: (prompt: string) => Promise<string>;
  close?: () => void | Promise<void>;
};

export async function createPromptIo(): Promise<PromptIo> {
  const rl = readline.createInterface({ input, output });
  return {
    question: (prompt) => rl.question(prompt),
    close: () => rl.close(),
  };
}

export async function confirm(
  io: PromptIo,
  message: string,
  defaultYes = true,
): Promise<boolean> {
  const hint = defaultYes ? "Y/n" : "y/N";
  const answer = (await io.question(`${message} [${hint}] `)).trim().toLowerCase();
  if (answer.length === 0) {
    return defaultYes;
  }
  return answer === "y" || answer === "yes";
}

export async function choose(
  io: PromptIo,
  message: string,
  options: readonly { value: string; label: string }[],
  defaultValue?: string,
): Promise<string> {
  console.log(message);
  for (const [index, option] of options.entries()) {
    const marker =
      defaultValue !== undefined && option.value === defaultValue
        ? dim(" (default)")
        : "";
    console.log(`  ${index + 1}) ${option.label}${marker}`);
  }

  const answer = (await io.question(dim("> "))).trim().toLowerCase();
  if (answer.length === 0 && defaultValue !== undefined) {
    return defaultValue;
  }

  const byNumber = Number.parseInt(answer, 10);
  if (
    Number.isInteger(byNumber) &&
    byNumber >= 1 &&
    byNumber <= options.length
  ) {
    return options[byNumber - 1]!.value;
  }

  const byValue = options.find(
    (option) =>
      option.value === answer ||
      option.label.toLowerCase() === answer ||
      option.label.toLowerCase().startsWith(answer),
  );
  if (byValue) {
    return byValue.value;
  }

  throw new Error(
    `Invalid choice "${answer}". Enter a number 1-${options.length}.`,
  );
}
