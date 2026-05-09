export type HarnessMode = 'chat' | 'code' | 'review' | 'docs' | 'product';

export type Settings = {
  provider: 'openai';
  defaultModel: string;
  hasOpenAiKey: boolean;
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
  messages: HarnessMessage[];
  createdAt: string;
  updatedAt: string;
};

export type ModelList = {
  source: 'fallback' | 'openai';
  models: string[];
};
