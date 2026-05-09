import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api.service';
import type { HarnessArtifact, HarnessConversation, HarnessFile, HarnessMessage, HarnessMode, Settings } from './types';

type Tab = 'chat' | 'templates' | 'files' | 'outputs' | 'models' | 'settings';

type WorkflowBlock = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
};

type TaskTemplate = {
  id: string;
  label: string;
  tagline: string;
  mode: HarnessMode;
  output: string;
  blocks: Omit<WorkflowBlock, 'value'>[];
};

const modes: { id: HarnessMode; label: string }[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'code', label: 'Code' },
  { id: 'review', label: 'Review' },
  { id: 'docs', label: 'Docs' },
  { id: 'product', label: 'Product' }
];

const templates: TaskTemplate[] = [
  {
    id: 'feature-plan',
    label: 'Feature Blueprint',
    tagline: 'Turn an idea into a scoped product and engineering plan.',
    mode: 'product',
    output: 'Product brief, user stories, acceptance criteria, risks, and implementation phases',
    blocks: [
      { id: 'vision', label: 'Vision', placeholder: 'What should exist when this is done?' },
      { id: 'users', label: 'Users', placeholder: 'Who uses it, and what are they trying to accomplish?' },
      { id: 'constraints', label: 'Constraints', placeholder: 'Timeline, tech stack, compliance, budget, launch limits.' },
      { id: 'success', label: 'Success', placeholder: 'How will we know it worked?' }
    ]
  },
  {
    id: 'code-review',
    label: 'Code Review Board',
    tagline: 'Review attached or pasted code like a senior engineer.',
    mode: 'review',
    output: 'Prioritized findings, risk notes, missing tests, and recommended fixes',
    blocks: [
      { id: 'scope', label: 'Scope', placeholder: 'What changed, or what files should be reviewed?' },
      { id: 'risk', label: 'Risk focus', placeholder: 'Security, data loss, concurrency, UX regression, performance, etc.' },
      { id: 'context', label: 'System context', placeholder: 'Framework, expected behavior, known edge cases.' }
    ]
  },
  {
    id: 'docs-kit',
    label: 'Documentation Kit',
    tagline: 'Produce docs that help someone actually ship or operate the thing.',
    mode: 'docs',
    output: 'README sections, usage guide, examples, troubleshooting, and operator notes',
    blocks: [
      { id: 'subject', label: 'Subject', placeholder: 'What needs documentation?' },
      { id: 'audience', label: 'Audience', placeholder: 'Developers, operators, admins, end users, executives.' },
      { id: 'operations', label: 'Operations', placeholder: 'Install, configure, run, recover, upgrade, debug.' },
      { id: 'tone', label: 'Tone', placeholder: 'Concise internal docs, polished public docs, tutorial, reference.' }
    ]
  },
  {
    id: 'implementation',
    label: 'Implementation Sprint',
    tagline: 'Guide the model from requirement to file-by-file implementation.',
    mode: 'code',
    output: 'Implementation plan, file changes, code blocks, verification steps',
    blocks: [
      { id: 'change', label: 'Change request', placeholder: 'What behavior should be added or fixed?' },
      { id: 'architecture', label: 'Architecture notes', placeholder: 'Existing patterns, APIs, boundaries, and files to respect.' },
      { id: 'tests', label: 'Verification', placeholder: 'How should this be tested or proven correct?' }
    ]
  },
  {
    id: 'launch-campaign',
    label: 'Launch Campaign',
    tagline: 'Create the story, assets, and rollout sequence for a release.',
    mode: 'product',
    output: 'Positioning, launch checklist, email copy, release notes, and success metrics',
    blocks: [
      { id: 'offer', label: 'Offer', placeholder: 'What is launching, and why does it matter now?' },
      { id: 'audience', label: 'Audience', placeholder: 'Segments, pain points, buying triggers, objections.' },
      { id: 'channels', label: 'Channels', placeholder: 'Website, email, sales, social, support, in-app.' },
      { id: 'voice', label: 'Voice', placeholder: 'Bold, precise, playful, executive, technical, etc.' }
    ]
  },
  {
    id: 'incident-response',
    label: 'Incident Commander',
    tagline: 'Turn a messy production incident into action, comms, and follow-up.',
    mode: 'product',
    output: 'Triage plan, customer update, internal timeline, remediation, and postmortem outline',
    blocks: [
      { id: 'symptoms', label: 'Symptoms', placeholder: 'What is broken, who is affected, when did it start?' },
      { id: 'signals', label: 'Signals', placeholder: 'Logs, metrics, errors, recent deploys, support reports.' },
      { id: 'actions', label: 'Actions taken', placeholder: 'Mitigations, rollbacks, owners, open questions.' },
      { id: 'comms', label: 'Comms needs', placeholder: 'Internal status, customer message, executive summary.' }
    ]
  },
  {
    id: 'research-synthesis',
    label: 'Research Synthesizer',
    tagline: 'Convert notes and files into decisions, themes, and next bets.',
    mode: 'product',
    output: 'Themes, evidence, decision matrix, open questions, and recommended next steps',
    blocks: [
      { id: 'question', label: 'Core question', placeholder: 'What are we trying to decide or understand?' },
      { id: 'sources', label: 'Sources', placeholder: 'Uploaded notes, interview snippets, links, data, constraints.' },
      { id: 'lens', label: 'Decision lens', placeholder: 'Revenue, user value, feasibility, risk, differentiation.' }
    ]
  }
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'chat', label: 'Chat' },
    { id: 'templates', label: 'Templates\\Task' },
    { id: 'files', label: 'Files' },
    { id: 'outputs', label: 'Outputs' },
    { id: 'models', label: 'Models' },
    { id: 'settings', label: 'Settings' }
  ];
  readonly modes = modes;
  readonly templates = templates;

  readonly activeTab = signal<Tab>('chat');
  readonly settings = signal<Settings | null>(null);
  readonly models = signal<string[]>([]);
  readonly modelSource = signal<'fallback' | 'openai'>('fallback');
  readonly files = signal<HarnessFile[]>([]);
  readonly artifacts = signal<HarnessArtifact[]>([]);
  readonly conversations = signal<HarnessConversation[]>([]);
  readonly activeConversationId = signal<string | null>(null);
  readonly busy = signal(false);
  readonly status = signal('Loading harness');
  readonly draft = signal('');
  readonly selectedMode = signal<HarnessMode>('chat');
  readonly selectedModel = signal('');
  readonly selectedFileIds = signal<string[]>([]);
  readonly apiKeyDraft = signal('');
  readonly previewArtifact = signal<HarnessArtifact | null>(null);
  readonly activeTemplate = signal<TaskTemplate>(templates[0]);
  readonly workflowBlocks = signal<WorkflowBlock[]>(templates[0].blocks.map((block) => ({ ...block, value: '' })));

  readonly activeConversation = computed(() => {
    const id = this.activeConversationId();
    return this.conversations().find((conversation) => conversation.id === id) || null;
  });

  constructor(private readonly api: ApiService) {}

  async ngOnInit() {
    await this.refreshAll();
  }

  async refreshAll() {
    this.busy.set(true);

    try {
      const [settings, modelList, files, conversations, artifacts] = await Promise.all([
        this.api.getSettings(),
        this.api.getModels(),
        this.api.getFiles(),
        this.api.getConversations(),
        this.api.getArtifacts()
      ]);

      this.settings.set(settings);
      this.models.set(modelList.models);
      this.modelSource.set(modelList.source);
      this.files.set(files);
      this.conversations.set(conversations);
      this.artifacts.set(artifacts);
      this.previewArtifact.set(artifacts[0] || null);
      this.selectedModel.set(settings.defaultModel || modelList.models[0] || '');

      if (!this.activeConversationId() && conversations[0]) {
        this.activeConversationId.set(conversations[0].id);
        this.selectedMode.set(conversations[0].mode);
        this.selectedModel.set(conversations[0].model);
      }

      this.status.set(settings.hasOpenAiKey ? 'OpenAI key configured' : 'No OpenAI key configured');
    } catch (error) {
      this.status.set(error instanceof Error ? error.message : 'Failed to load harness');
    } finally {
      this.busy.set(false);
    }
  }

  async saveSettings() {
    this.busy.set(true);

    try {
      const settings = await this.api.saveSettings({
        openaiApiKey: this.apiKeyDraft() || undefined,
        defaultModel: this.selectedModel()
      });
      this.settings.set(settings);
      this.status.set('Settings saved');
      await this.refreshModels();
    } catch (error) {
      this.status.set(error instanceof Error ? error.message : 'Could not save settings');
    } finally {
      this.busy.set(false);
    }
  }

  async refreshModels() {
    const modelList = await this.api.getModels();
    this.models.set(modelList.models);
    this.modelSource.set(modelList.source);
  }

  async createConversation() {
    const model = this.selectedModel() || this.settings()?.defaultModel || 'gpt-5.2';
    const conversation = await this.api.createConversation({
      title: `${this.selectedMode()} session`,
      model,
      mode: this.selectedMode()
    });

    this.conversations.update((items) => [conversation, ...items]);
    this.activeConversationId.set(conversation.id);
    this.activeTab.set('chat');
  }

  selectConversation(conversation: HarnessConversation) {
    this.activeConversationId.set(conversation.id);
    this.selectedMode.set(conversation.mode);
    this.selectedModel.set(conversation.model);
  }

  selectTemplate(template: TaskTemplate) {
    this.activeTemplate.set(template);
    this.workflowBlocks.set(template.blocks.map((block) => ({ ...block, value: '' })));
    this.selectedMode.set(template.mode);
  }

  updateBlock(blockId: string, value: string) {
    this.workflowBlocks.update((blocks) => blocks.map((block) => (block.id === blockId ? { ...block, value } : block)));
  }

  launchWorkflow() {
    const template = this.activeTemplate();
    const filledBlocks = this.workflowBlocks()
      .map((block) => `${block.label}:\n${block.value.trim() || '[not provided]'}`)
      .join('\n\n');
    const fileNote = this.selectedFileIds().length
      ? `Use the ${this.selectedFileIds().length} attached file(s) as source context.`
      : 'No files are attached; use only the information below.';

    this.selectedMode.set(template.mode);
    this.draft.set(
      [
        `Run the "${template.label}" workflow.`,
        '',
        `Desired output: ${template.output}.`,
        fileNote,
        '',
        'Workflow inputs:',
        filledBlocks,
        '',
        'Return a polished, actionable result with clear sections and concrete next steps.'
      ].join('\n')
    );
    this.activeTab.set('chat');
  }

  applyTemplate(template: TaskTemplate) {
    this.selectTemplate(template);
    this.launchWorkflow();
  }

  useTemplateOnly(template: TaskTemplate) {
    this.selectedMode.set(template.mode);
    this.draft.set(`Run the "${template.label}" workflow.\n\nDesired output: ${template.output}.\n\nAsk me for any missing details before producing the final result.`);
    this.activeTab.set('chat');
  }

  toggleFile(fileId: string) {
    this.selectedFileIds.update((ids) => (ids.includes(fileId) ? ids.filter((id) => id !== fileId) : [...ids, fileId]));
  }

  async sendMessage() {
    const text = this.draft().trim();

    if (!text || this.busy()) {
      return;
    }

    if (!this.activeConversation()) {
      await this.createConversation();
    }

    const conversationId = this.activeConversationId();
    if (!conversationId) {
      return;
    }

    this.busy.set(true);
    this.draft.set('');
    const now = new Date().toISOString();
    const userMessage: HarnessMessage = {
      id: `local_user_${Date.now()}`,
      role: 'user',
      content: text,
      mode: this.selectedMode(),
      createdAt: now
    };
    const assistantMessage: HarnessMessage = {
      id: `local_assistant_${Date.now()}`,
      role: 'assistant',
      content: '',
      mode: this.selectedMode(),
      createdAt: now
    };

    this.patchConversationMessages(conversationId, [userMessage, assistantMessage]);

    try {
      await this.api.sendMessage(
        conversationId,
        { content: text, model: this.selectedModel(), mode: this.selectedMode(), fileIds: this.selectedFileIds() },
        (delta) => {
          this.appendAssistantDelta(conversationId, assistantMessage.id, delta);
        }
      );

      const [conversations, artifacts] = await Promise.all([this.api.getConversations(), this.api.getArtifacts()]);
      this.conversations.set(conversations);
      this.artifacts.set(artifacts);
      this.previewArtifact.set(artifacts[0] || this.previewArtifact());
      this.activeConversationId.set(conversationId);
      this.status.set('Response complete');
    } catch (error) {
      this.status.set(error instanceof Error ? error.message : 'Message failed');
    } finally {
      this.busy.set(false);
    }
  }

  async upload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    this.busy.set(true);

    try {
      this.files.set(await this.api.uploadFiles(input.files));
      input.value = '';
      this.status.set('Files uploaded');
    } catch (error) {
      this.status.set(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      this.busy.set(false);
    }
  }

  selectedFileLabel() {
    const count = this.selectedFileIds().length;
    return count ? `${count} file${count === 1 ? '' : 's'} attached` : 'No files attached';
  }

  formatBytes(size: number) {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  private patchConversationMessages(conversationId: string, messages: HarnessMessage[]) {
    this.conversations.update((items) =>
      items.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: [...conversation.messages, ...messages],
              mode: this.selectedMode(),
              model: this.selectedModel()
            }
          : conversation
      )
    );
  }

  private appendAssistantDelta(conversationId: string, messageId: string, delta: string) {
    this.conversations.update((items) =>
      items.map((conversation) => {
        if (conversation.id !== conversationId) {
          return conversation;
        }

        return {
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === messageId ? { ...message, content: message.content + delta } : message
          )
        };
      })
    );
  }
}
