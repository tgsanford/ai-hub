import OpenAI from 'openai';
import type { HarnessMode, HarnessSettings } from './store.js';

export const fallbackModels = [
  'gpt-5.2',
  'gpt-5.2-pro',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-4.1'
];

export function getOpenAiClient(settings: HarnessSettings): OpenAI | null {
  const apiKey = process.env['OPENAI_API_KEY'] || settings.openaiApiKey;
  return apiKey ? new OpenAI({ apiKey }) : null;
}

export function modeInstructions(mode: HarnessMode): string {
  const shared = 'You are operating inside an AI harness for practical software and product work. Be direct, structured, and actionable.';

  const byMode: Record<HarnessMode, string> = {
    chat: 'Answer the user and ask only necessary clarifying questions.',
    code: 'Create or correct code. Explain file-level changes and surface assumptions before risky edits.',
    review: 'Review code for bugs, regressions, missing tests, security risks, and maintainability issues. Findings first.',
    docs: 'Write clear documentation with accurate steps, constraints, and examples.',
    product: 'Produce product output such as briefs, PRDs, release notes, user stories, acceptance criteria, and implementation plans.'
  };

  return `${shared}\n\nMode: ${mode}\n${byMode[mode]}`;
}
