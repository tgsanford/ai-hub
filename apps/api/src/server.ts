import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import path from 'node:path';
import { mkdir, readFile } from 'node:fs/promises';
import { z } from 'zod';
import { fallbackModels, getOpenAiClient, modeInstructions } from './openai.js';
import {
  createId,
  HarnessModeSchema,
  publicSettings,
  readStore,
  updateStore,
  type HarnessConversation
} from './store.js';

const app = express();
const port = Number(process.env['PORT'] || 3000);
const uploadDir = path.resolve(process.cwd(), 'uploads');

await mkdir(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 10
  }
});

app.use(helmet());
app.use(cors({ origin: process.env['WEB_ORIGIN'] || 'http://localhost:4200' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'openaiwork-api' });
});

app.get('/api/settings', async (_req, res, next) => {
  try {
    const store = await readStore();
    res.json(publicSettings(store.settings));
  } catch (error) {
    next(error);
  }
});

app.put('/api/settings', async (req, res, next) => {
  const schema = z.object({
    openaiApiKey: z.string().trim().optional(),
    defaultModel: z.string().trim().min(1)
  });

  try {
    const input = schema.parse(req.body);
    const store = await updateStore((draft) => {
      draft.settings.provider = 'openai';
      draft.settings.defaultModel = input.defaultModel;

      if (input.openaiApiKey) {
        draft.settings.openaiApiKey = input.openaiApiKey;
      }
    });

    res.json(publicSettings(store.settings));
  } catch (error) {
    next(error);
  }
});

app.get('/api/models', async (_req, res, next) => {
  try {
    const store = await readStore();
    const client = getOpenAiClient(store.settings);

    if (!client) {
      res.json({ source: 'fallback', models: fallbackModels });
      return;
    }

    const response = await client.models.list();
    const models = response.data
      .map((model) => model.id)
      .filter((id) => id.startsWith('gpt-') || id.startsWith('o'))
      .sort();

    res.json({ source: 'openai', models });
  } catch (error) {
    next(error);
  }
});

app.get('/api/files', async (_req, res, next) => {
  try {
    const store = await readStore();
    res.json(store.files);
  } catch (error) {
    next(error);
  }
});

app.get('/api/artifacts', async (_req, res, next) => {
  try {
    const store = await readStore();
    res.json(store.artifacts);
  } catch (error) {
    next(error);
  }
});

app.post('/api/files', upload.array('files'), async (req, res, next) => {
  try {
    const files = (req.files || []) as Express.Multer.File[];
    const now = new Date().toISOString();

    const store = await updateStore((draft) => {
      for (const file of files) {
        draft.files.unshift({
          id: createId('file'),
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          createdAt: now
        });
      }
    });

    res.status(201).json(store.files);
  } catch (error) {
    next(error);
  }
});

app.get('/api/conversations', async (_req, res, next) => {
  try {
    const store = await readStore();
    res.json(store.conversations);
  } catch (error) {
    next(error);
  }
});

app.post('/api/conversations', async (req, res, next) => {
  const schema = z.object({
    title: z.string().trim().min(1).default('New conversation'),
    model: z.string().trim().optional(),
    mode: HarnessModeSchema.default('chat')
  });

  try {
    const input = schema.parse(req.body);
    const now = new Date().toISOString();
    const store = await updateStore((draft) => {
      draft.conversations.unshift({
        id: createId('conv'),
        title: input.title,
        model: input.model || draft.settings.defaultModel,
        mode: input.mode,
        messages: [],
        createdAt: now,
        updatedAt: now
      });
    });

    res.status(201).json(store.conversations[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/api/conversations/:id/messages', async (req, res, next) => {
  const schema = z.object({
    content: z.string().trim().min(1),
    model: z.string().trim().optional(),
    mode: HarnessModeSchema.optional(),
    fileIds: z.array(z.string()).default([])
  });

  try {
    const input = schema.parse(req.body);
    const store = await readStore();
    const conversation = store.conversations.find((item) => item.id === req.params.id);

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const mode = input.mode || conversation.mode;
    const model = input.model || conversation.model || store.settings.defaultModel;
    const fileContext = await buildFileContext(store.files.filter((file) => input.fileIds.includes(file.id)));
    const modelInput = fileContext ? `${fileContext}\n\nUser task:\n${input.content}` : input.content;
    const userMessage = {
      id: createId('msg'),
      role: 'user' as const,
      content: input.content,
      mode,
      createdAt: new Date().toISOString()
    };

    await updateConversation(conversation.id, (draft) => {
      draft.mode = mode;
      draft.model = model;
      draft.messages.push(userMessage);
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const client = getOpenAiClient(store.settings);
    let assistantText = '';
    let responseId: string | undefined;

    if (!client) {
      assistantText = [
        `Local harness response for ${mode} mode.`,
        '',
        'Add an OpenAI API key in Settings or .env to enable live model output.',
        '',
        fileContext ? `Attached context:\n${fileContext}` : 'No files attached.',
        '',
        `Prompt received: ${input.content}`
      ].join('\n');
      sendEvent(res, 'delta', { text: assistantText });
    } else {
      const stream = await client.responses.create({
        model,
        instructions: modeInstructions(mode),
        previous_response_id: conversation.responseId,
        input: modelInput,
        stream: true
      });

      for await (const event of stream) {
        if (event.type === 'response.created') {
          responseId = event.response.id;
        }

        if (event.type === 'response.output_text.delta') {
          assistantText += event.delta;
          sendEvent(res, 'delta', { text: event.delta });
        }
      }
    }

    const assistantMessage = {
      id: createId('msg'),
      role: 'assistant' as const,
      content: assistantText,
      mode,
      createdAt: new Date().toISOString()
    };

    await updateConversation(conversation.id, (draft) => {
      draft.responseId = responseId || draft.responseId;
      draft.messages.push(assistantMessage);
    });

    await createArtifacts(conversation.id, mode, assistantText);

    sendEvent(res, 'done', { message: assistantMessage });
    res.end();
  } catch (error) {
    next(error);
  }
});

function sendEvent(res: express.Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function buildFileContext(files: { originalName: string; mimeType: string; size: number; path: string }[]) {
  const chunks: string[] = [];
  const maxBytesPerFile = 120_000;

  for (const file of files.slice(0, 6)) {
    if (!isTextLike(file.mimeType, file.originalName)) {
      chunks.push(`File: ${file.originalName}\nType: ${file.mimeType || 'unknown'}\nContent was not embedded because it is not text-like.`);
      continue;
    }

    const raw = await readFile(file.path, 'utf8');
    const content = raw.length > maxBytesPerFile ? `${raw.slice(0, maxBytesPerFile)}\n[truncated]` : raw;
    chunks.push(`File: ${file.originalName}\nType: ${file.mimeType || 'text/plain'}\n\n${content}`);
  }

  return chunks.length ? `Attached file context:\n\n${chunks.join('\n\n---\n\n')}` : '';
}

function isTextLike(mimeType: string, fileName: string) {
  const lower = fileName.toLowerCase();
  return (
    mimeType.startsWith('text/') ||
    mimeType.includes('json') ||
    mimeType.includes('xml') ||
    ['.ts', '.js', '.html', '.css', '.md', '.txt', '.json', '.py', '.java', '.cs', '.go', '.rs', '.sql', '.yaml', '.yml'].some((ext) =>
      lower.endsWith(ext)
    )
  );
}

async function createArtifacts(conversationId: string, mode: z.infer<typeof HarnessModeSchema>, assistantText: string) {
  if (!assistantText.trim()) {
    return;
  }

  const now = new Date().toISOString();
  const codeBlocks = [...assistantText.matchAll(/```(\w+)?\n([\s\S]*?)```/g)];

  await updateStore((draft) => {
    for (const match of codeBlocks.slice(0, 6)) {
      const language = match[1] || 'code';
      draft.artifacts.unshift({
        id: createId('artifact'),
        conversationId,
        title: `${language} snippet`,
        kind: 'snippet',
        content: match[2].trim(),
        createdAt: now
      });
    }

    if (mode === 'docs' || mode === 'product' || mode === 'code') {
      draft.artifacts.unshift({
        id: createId('artifact'),
        conversationId,
        title: `${mode} output`,
        kind: mode,
        content: assistantText,
        createdAt: now
      });
    }
  });
}

async function updateConversation(id: string, mutator: (conversation: HarnessConversation) => void) {
  await updateStore((draft) => {
    const conversation = draft.conversations.find((item) => item.id === id);
    if (!conversation) {
      return;
    }

    mutator(conversation);
    conversation.updatedAt = new Date().toISOString();
  });
}

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);

  if (error instanceof z.ZodError) {
    res.status(400).json({ error: 'Invalid request', details: error.flatten() });
    return;
  }

  res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected server error' });
});

app.listen(port, () => {
  console.log(`OpenAIwork API listening on http://localhost:${port}`);
});
