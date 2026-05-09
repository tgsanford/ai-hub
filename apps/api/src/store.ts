import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

const dataDir = path.resolve(process.cwd(), '.data');
const storePath = path.join(dataDir, 'store.json');

export const HarnessModeSchema = z.enum(['chat', 'code', 'review', 'docs', 'product']);
export type HarnessMode = z.infer<typeof HarnessModeSchema>;

export type HarnessSettings = {
  provider: 'openai';
  openaiApiKey?: string;
  defaultModel: string;
};

export type HarnessFile = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
};

export type HarnessArtifact = {
  id: string;
  conversationId: string;
  title: string;
  kind: HarnessMode | 'snippet';
  content: string;
  createdAt: string;
};

export type HarnessMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode: HarnessMode;
  createdAt: string;
};

export type HarnessConversation = {
  id: string;
  title: string;
  model: string;
  mode: HarnessMode;
  responseId?: string;
  messages: HarnessMessage[];
  createdAt: string;
  updatedAt: string;
};

type HarnessStore = {
  settings: HarnessSettings;
  files: HarnessFile[];
  conversations: HarnessConversation[];
  artifacts: HarnessArtifact[];
};

const defaultStore: HarnessStore = {
  settings: {
    provider: 'openai',
    defaultModel: 'gpt-5.2'
  },
  files: [],
  conversations: [],
  artifacts: []
};

export function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export async function readStore(): Promise<HarnessStore> {
  await mkdir(dataDir, { recursive: true });

  try {
    const raw = await readFile(storePath, 'utf8');
    return { ...defaultStore, ...JSON.parse(raw) } as HarnessStore;
  } catch {
    await writeStore(defaultStore);
    return defaultStore;
  }
}

export async function writeStore(store: HarnessStore): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2));
}

export async function updateStore(mutator: (store: HarnessStore) => void): Promise<HarnessStore> {
  const store = await readStore();
  mutator(store);
  await writeStore(store);
  return store;
}

export function publicSettings(settings: HarnessSettings) {
  return {
    provider: settings.provider,
    defaultModel: settings.defaultModel,
    hasOpenAiKey: Boolean(process.env['OPENAI_API_KEY'] || settings.openaiApiKey)
  };
}
