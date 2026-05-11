import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ApiService } from './api.service';
import type { HarnessArtifact, HarnessConversation, HarnessFile, HarnessMessage, HarnessMode, HarnessProject, Settings } from './types';

type Tab = 'home' | 'projects' | 'library' | 'settings';
type LibrarySubTab = 'templates' | 'files' | 'outputs';

type ToastType = 'success' | 'error' | 'loading';
type Toast = {
  id: string;
  message: string;
  type: ToastType;
  dismissible: boolean;
};

type WorkflowBlock = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options?: string[]; // For dropdown selections
  type?: 'text' | 'select' | 'checkbox'; // Field type
  checked?: boolean; // For checkbox state
  example?: string; // Inline example text to guide users
  helpText?: string; // Tooltip help text
  maxLength?: number; // Character limit for text fields
};

type TemplateCategory = 'all' | 'development' | 'product' | 'quality' | 'documentation' | 'operations';

type TaskTemplate = {
  id: string;
  label: string;
  tagline: string;
  description: string;
  mode: HarnessMode;
  category: TemplateCategory;
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

const categories: { id: TemplateCategory; label: string; description: string }[] = [
  { id: 'all', label: 'All Templates', description: 'View all available workflows' },
  { id: 'development', label: 'Development', description: 'Code implementation and translation' },
  { id: 'product', label: 'Product & Strategy', description: 'Planning, launches, and research' },
  { id: 'quality', label: 'Code Quality', description: 'Reviews and best practices' },
  { id: 'documentation', label: 'Documentation', description: 'Guides and reference materials' },
  { id: 'operations', label: 'Operations', description: 'Incidents and system management' }
];

const templates: TaskTemplate[] = [
  {
    id: 'feature-plan',
    label: 'Feature Blueprint',
    tagline: 'Turn an idea into a scoped product and engineering plan.',
    description: `This template helps you transform a rough idea into a concrete, actionable product plan. Fill in what you envision, who will use it, any constraints you're working within, and how you'll measure success. The AI will generate a structured product brief with user stories, acceptance criteria, risk analysis, and phased implementation steps. Perfect for turning "we should build something" into "here's exactly what we're building and how."`,
    mode: 'product',
    category: 'product',
    output: 'Product brief, user stories, acceptance criteria, risks, and implementation phases',
    blocks: [
      { 
        id: 'vision', 
        label: 'Vision', 
        placeholder: 'What should exist when this is done?',
        example: 'A mobile app that lets remote teams play trivia games during virtual meetings',
        helpText: 'Be specific about outcomes. What will users be able to do? Focus on the end state, not implementation details.',
        maxLength: 500
      },
      { 
        id: 'users', 
        label: 'Users', 
        placeholder: 'Who uses it, and what are they trying to accomplish?',
        example: 'Remote team leads who want to build team engagement during weekly sync meetings',
        helpText: 'Describe your target users and their core goals. What problem are they trying to solve?',
        maxLength: 500
      },
      { 
        id: 'constraints', 
        label: 'Constraints', 
        placeholder: 'Timeline, tech stack, compliance, budget, launch limits.',
        example: 'Must work on mobile and desktop, launch in 3 months, GDPR compliant, budget $50k',
        helpText: 'List any technical, business, or regulatory constraints that will shape this project.',
        maxLength: 500
      },
      { 
        id: 'success', 
        label: 'Success', 
        placeholder: 'How will we know it worked?',
        example: '70% of teams use it weekly, 4.5+ star rating, 30% retention after 1 month',
        helpText: 'Define measurable outcomes. What metrics or user behaviors indicate success?',
        maxLength: 300
      }
    ]
  },
  {
    id: 'code-review',
    label: 'Code Review Board',
    tagline: 'Review attached or pasted code like a senior engineer.',
    description: `Get a thorough code review from an AI perspective. Describe what changed or which files to review, highlight specific risk areas you're concerned about (security, performance, etc.), and provide context about your system. You can attach code files or paste code directly. The AI will analyze your code with a senior engineer's eye, identifying bugs, security issues, performance problems, missing tests, and suggesting concrete improvements with prioritized findings.`,
    mode: 'review',
    category: 'quality',
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
    description: `Create comprehensive documentation that actually helps people use or maintain your project. Specify what needs documenting, who will read it (developers, operators, end users), what operations they need to perform (install, configure, troubleshoot), and the tone you want (technical, tutorial, reference). The AI will generate practical documentation including setup instructions, usage examples, troubleshooting guides, and operational notes—documentation people will actually read and find useful.`,
    mode: 'docs',
    category: 'documentation',
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
    description: `Turn a feature request into actual code with a detailed implementation plan. Describe what behavior you want to add or fix, explain your existing architecture and patterns to follow, and specify how the change should be tested. The AI will break down the implementation into specific file changes, provide complete code blocks ready to use, and suggest verification steps to ensure correctness. Great for getting from "we need to add X" to "here's exactly how to code X."`,
    mode: 'code',
    category: 'development',
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
    description: `Plan and execute a product launch with marketing materials, messaging, and a rollout strategy. Describe what you're launching and why it matters, define your target audience with their pain points, list your distribution channels (email, social, in-app, etc.), and specify your brand voice. The AI will create positioning statements, a detailed launch checklist, email copy, release notes, social media posts, and success metrics—everything you need to announce your product effectively.`,
    mode: 'product',
    category: 'product',
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
    description: `Manage a production incident systematically from chaos to resolution. Describe the symptoms (what's broken, who's affected), provide signals you're seeing (logs, metrics, errors), document actions you've taken, and specify communication needs (internal status, customer message, executive summary). The AI will help you triage effectively, draft customer communications, create an internal timeline, identify remediation steps, and outline a postmortem—turning incident chaos into structured response.`,
    mode: 'product',
    category: 'operations',
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
    description: `Turn scattered research into clear decisions and actionable insights. State your core question or what you're trying to decide, provide your sources (interview notes, data, constraints—you can attach files), and specify your decision lens (revenue impact, user value, feasibility, etc.). The AI will analyze everything, identify key themes, present supporting evidence, create a decision matrix to compare options, surface open questions, and recommend concrete next steps. Perfect for turning research into decisions.`,
    mode: 'product',
    category: 'product',
    output: 'Themes, evidence, decision matrix, open questions, and recommended next steps',
    blocks: [
      { id: 'question', label: 'Core question', placeholder: 'What are we trying to decide or understand?' },
      { id: 'sources', label: 'Sources', placeholder: 'Uploaded notes, interview snippets, links, data, constraints.' },
      { id: 'lens', label: 'Decision lens', placeholder: 'Revenue, user value, feasibility, risk, differentiation.' }
    ]
  },
  {
    id: 'code-translator',
    label: 'Code Translator',
    tagline: 'Convert code from one language to another with customizable output.',
    description: `Translate code from one programming language to another while preserving functionality and adapting to language-specific idioms. Select your source and target languages, paste or describe your code, specify any requirements (frameworks, coding style, libraries), and choose what to include (documentation, examples, usage notes). The AI will convert your code to the target language using appropriate patterns and best practices, optionally adding helpful documentation and examples to make the translated code immediately usable.`,
    mode: 'code',
    category: 'development',
    output: 'Translated code with optional documentation, examples, and usage notes',
    blocks: [
      { 
        id: 'source-language', 
        label: 'Source Language', 
        placeholder: 'Select source language',
        type: 'select',
        options: ['Python', 'JavaScript', 'TypeScript', 'Java', 'C#', 'Ruby', 'Go', 'PHP', 'Kotlin', 'Swift', 'Rust', 'C++']
      },
      { 
        id: 'target-language', 
        label: 'Target Language', 
        placeholder: 'Select target language',
        type: 'select',
        options: ['TypeScript', 'Python', 'JavaScript', 'Kotlin', 'Go', 'Rust', 'Swift', 'Java', 'C#', 'Ruby', 'PHP', 'C++']
      },
      { id: 'code-input', label: 'Source Code', placeholder: 'Paste the code here, or describe the file/link to convert', type: 'text' },
      { id: 'requirements', label: 'Requirements', placeholder: 'Framework preferences, coding style, specific libraries to use, or patterns to follow', type: 'text' },
      { id: 'include-docs', label: 'Include Documentation', placeholder: '', type: 'checkbox', checked: true },
      { id: 'include-examples', label: 'Include Examples', placeholder: '', type: 'checkbox', checked: true },
      { id: 'include-usage', label: 'Include Usage Notes', placeholder: '', type: 'checkbox', checked: false }
    ]
  }
];

import { MarkdownPipe } from './markdown.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe, DragDropModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'projects', label: 'Projects' },
    { id: 'library', label: 'Library' },
    { id: 'settings', label: 'Settings' }
  ];
  readonly librarySubTabs: { id: LibrarySubTab; label: string }[] = [
    { id: 'templates', label: 'Templates' },
    { id: 'files', label: 'Files' },
    { id: 'outputs', label: 'Outputs' }
  ];
  readonly modes = modes;
  readonly categories = categories;
  readonly templates = signal<TaskTemplate[]>(this.loadTemplateOrder());
  readonly selectedCategory = signal<TemplateCategory>('all');

  readonly activeTab = signal<Tab>('home');
  readonly activeLibrarySubTab = signal<LibrarySubTab>('templates');
  readonly settings = signal<Settings | null>(null);
  readonly models = signal<string[]>([]);
  readonly modelSource = signal<'fallback' | 'openai'>('fallback');
  readonly files = signal<HarnessFile[]>([]);
  readonly artifacts = signal<HarnessArtifact[]>([]);
  readonly conversations = signal<HarnessConversation[]>([]);
  readonly projects = signal<HarnessProject[]>([]);
  readonly activeConversationId = signal<string | null>(null);
  readonly activeProjectId = signal<string | null>(null);
  readonly busy = signal(false);
  readonly status = signal('Loading harness');
  readonly toasts = signal<Toast[]>([]);
  readonly draft = signal('');
  readonly selectedMode = signal<HarnessMode>('chat');
  readonly selectedModel = signal('');
  readonly selectedFileIds = signal<string[]>([]);
  readonly apiKeyDraft = signal('');
  readonly githubUrlDraft = signal('');
  readonly bitbucketUrlDraft = signal('');
  readonly previewArtifact = signal<HarnessArtifact | null>(null);
  readonly activeTemplate = signal<TaskTemplate>(templates[0]);
  readonly activeTemplateId = signal<string | null>(null); // Track active template for filtering
  readonly workflowBlocks = signal<WorkflowBlock[]>(templates[0].blocks.map((block) => ({ ...block, value: '' })));
  readonly streamingContent = signal('');
  readonly isStreaming = signal(false);
  readonly activeWorkflowStep = signal<'frame' | 'context' | 'output'>('frame');
  
  // Project title editing
  readonly isEditingProjectTitle = signal(false);
  readonly editingProjectTitle = signal('');

  readonly activeConversation = computed(() => {
    const id = this.activeConversationId();
    const projectId = this.activeProjectId();
    const conversation = this.conversations().find((conversation) => conversation.id === id) || null;
    
    // If we're in a project, only show conversations that belong to this project
    if (projectId && conversation) {
      return conversation.projectId === projectId ? conversation : null;
    }
    
    return conversation;
  });

  readonly activeProject = computed(() => {
    const id = this.activeProjectId();
    return this.projects().find((project) => project.id === id) || null;
  });

  // Filter conversations for the active project
  readonly projectConversations = computed(() => {
    const projectId = this.activeProjectId();
    if (!projectId) {
      return this.conversations().filter((c) => !c.projectId); // Show non-project conversations
    }
    return this.conversations().filter((c) => c.projectId === projectId);
  });

  // Filter conversations for the sidebar (only show non-project conversations)
  readonly sidebarConversations = computed(() => {
    return this.conversations().filter((c) => !c.projectId);
  });

  // Filter files for the active project
  readonly projectFiles = computed(() => {
    const project = this.activeProject();
    if (!project) {
      return this.files();
    }
    return this.files().filter((f) => project.fileIds.includes(f.id));
  });

  // Filter artifacts for the active project
  readonly projectArtifacts = computed(() => {
    const project = this.activeProject();
    if (!project) {
      return this.artifacts();
    }
    return this.artifacts().filter((a) => project.artifactIds.includes(a.id));
  });

  // Filter messages for the active template context
  readonly templateMessages = computed(() => {
    const conversation = this.activeConversation();
    const projectId = this.activeProjectId();
    
    if (!conversation) {
      return [];
    }
    
    // If we have an active project, show all messages from this conversation
    if (projectId && conversation.projectId === projectId) {
      return conversation.messages;
    }
    
    return [];
  });

  readonly quickPrompts = [
    { label: '💡 Explain this code', prompt: 'Explain what this code does and how it works:', mode: 'code' as HarnessMode },
    { label: '🐛 Debug issue', prompt: 'Help me debug this issue:', mode: 'code' as HarnessMode },
    { label: '📝 Write documentation', prompt: 'Write clear documentation for:', mode: 'docs' as HarnessMode },
    { label: '🔍 Review code', prompt: 'Review this code for bugs, security issues, and best practices:', mode: 'review' as HarnessMode },
    { label: '🚀 Plan feature', prompt: 'Help me plan and spec out this feature:', mode: 'product' as HarnessMode }
  ];

  // Filter templates by selected category
  readonly filteredTemplates = computed(() => {
    const category = this.selectedCategory();
    if (category === 'all') {
      return this.templates();
    }
    return this.templates().filter((t) => t.category === category);
  });

  readonly selectedFileLabel = computed(() => {
    const count = this.selectedFileIds().length;
    return count === 0 ? 'No files' : count === 1 ? '1 file' : `${count} files`;
  });

  constructor(private readonly api: ApiService) {}

  async ngOnInit() {
    await this.refreshAll();
    this.setupKeyboardShortcuts();
    this.loadRepositoryUrls();
  }

  // Toast notification methods
  private showToast(message: string, type: ToastType = 'success') {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const dismissible = type !== 'loading';
    
    const toast: Toast = { id, message, type, dismissible };
    this.toasts.update(toasts => [...toasts, toast]);
    
    // Auto-dismiss success toasts after 3 seconds
    if (type === 'success') {
      setTimeout(() => this.dismissToast(id), 3000);
    }
  }

  private dismissToast(id: string) {
    this.toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  private dismissAllLoadingToasts() {
    this.toasts.update(toasts => toasts.filter(t => t.type !== 'loading'));
  }

  // Load repository URLs from localStorage
  private loadRepositoryUrls() {
    const githubUrl = localStorage.getItem('githubUrl');
    const bitbucketUrl = localStorage.getItem('bitbucketUrl');
    
    if (githubUrl) {
      this.githubUrlDraft.set(githubUrl);
    }
    if (bitbucketUrl) {
      this.bitbucketUrlDraft.set(bitbucketUrl);
    }
  }

  // Load template order from localStorage, fallback to default templates
  private loadTemplateOrder(): TaskTemplate[] {
    const saved = localStorage.getItem('templateOrder');
    if (saved) {
      try {
        const orderIds = JSON.parse(saved) as string[];
        // Reorder templates based on saved IDs
        const ordered: TaskTemplate[] = [];
        for (const id of orderIds) {
          const template = templates.find(t => t.id === id);
          if (template) ordered.push(template);
        }
        // Add any new templates that weren't in saved order
        for (const template of templates) {
          if (!ordered.find(t => t.id === template.id)) {
            ordered.push(template);
          }
        }
        return ordered;
      } catch {
        return [...templates];
      }
    }
    return [...templates];
  }

  // Save template order to localStorage
  private saveTemplateOrder() {
    const orderIds = this.templates().map(t => t.id);
    localStorage.setItem('templateOrder', JSON.stringify(orderIds));
  }

  // Handle drag and drop reordering
  reorderTemplates(event: CdkDragDrop<TaskTemplate[]>) {
    const items = [...this.templates()];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.templates.set(items);
    this.saveTemplateOrder();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K: Focus on message input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const textarea = document.querySelector('.composer textarea') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          this.activeTab.set('projects');
        }
      }

      // Cmd/Ctrl + N: New conversation
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        this.createConversation();
      }

      // Cmd/Ctrl + E: Export conversation
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        if (this.activeConversation()) {
          this.exportConversation();
        }
      }

      // Escape: Clear draft
      if (e.key === 'Escape' && this.activeTab() === 'projects') {
        this.draft.set('');
      }
    });
  }

  async refreshAll() {
    this.busy.set(true);

    try {
      const [settings, modelList, files, conversations, artifacts, projects] = await Promise.all([
        this.api.getSettings(),
        this.api.getModels(),
        this.api.getFiles(),
        this.api.getConversations(),
        this.api.getArtifacts(),
        this.api.getProjects()
      ]);

      this.settings.set(settings);
      this.models.set(modelList.models);
      this.modelSource.set(modelList.source);
      this.files.set(files);
      this.conversations.set(conversations);
      this.artifacts.set(artifacts);
      this.projects.set(projects);
      this.previewArtifact.set(artifacts[0] || null);
      this.selectedModel.set(settings.defaultModel || modelList.models[0] || '');

      if (!this.activeConversationId() && conversations[0]) {
        this.activeConversationId.set(conversations[0].id);
        this.selectedMode.set(conversations[0].mode);
        this.selectedModel.set(conversations[0].model);
      }

      this.showToast(settings.hasOpenAiKey ? 'OpenAI key configured' : 'No OpenAI key configured', 'success');
    } catch (error) {
      this.showToast(error instanceof Error ? error.message : 'Failed to load harness', 'error');
    } finally {
      this.busy.set(false);
    }
  }

  formatTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  async saveSettings() {
    this.busy.set(true);

    try {
      const defaultModel = this.selectedModel() || this.settings()?.defaultModel || this.models()[0] || 'gpt-5.2';
      const settings = await this.api.saveSettings({
        openaiApiKey: this.apiKeyDraft() || undefined,
        defaultModel
      });
      this.settings.set(settings);
      this.selectedModel.set(defaultModel);
      
      // Save repository URLs to localStorage
      if (this.githubUrlDraft()) {
        localStorage.setItem('githubUrl', this.githubUrlDraft());
      } else {
        localStorage.removeItem('githubUrl');
      }
      
      if (this.bitbucketUrlDraft()) {
        localStorage.setItem('bitbucketUrl', this.bitbucketUrlDraft());
      } else {
        localStorage.removeItem('bitbucketUrl');
      }
      
      this.showToast('Settings saved', 'success');
      await this.refreshModels();
    } catch (error) {
      this.showToast(error instanceof Error ? error.message : 'Could not save settings', 'error');
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
    const projectId = this.activeProjectId();
    
    const conversation = await this.api.createConversation({
      title: `${this.selectedMode()} session`,
      model,
      mode: this.selectedMode(),
      projectId: projectId || undefined
    });

    this.conversations.update((items) => [conversation, ...items]);
    this.activeConversationId.set(conversation.id);
    
    // If this conversation belongs to a project, update the project
    if (projectId) {
      this.projects.update((projects) =>
        projects.map((p) =>
          p.id === projectId ? { ...p, conversationIds: [...p.conversationIds, conversation.id] } : p
        )
      );
    }
    
    this.activeTab.set('projects');
  }

  async createStandaloneConversation() {
    const model = this.selectedModel() || this.settings()?.defaultModel || 'gpt-5.2';
    
    const conversation = await this.api.createConversation({
      title: `${this.selectedMode()} session`,
      model,
      mode: this.selectedMode(),
      projectId: undefined
    });

    this.conversations.update((items) => [conversation, ...items]);
    this.activeConversationId.set(conversation.id);
    
    // Clear project context since this is a standalone conversation
    this.activeProjectId.set(null);
    this.selectedFileIds.set([]);
    this.activeTab.set('home');
  }

  selectConversation(conversation: HarnessConversation) {
    const projectId = this.activeProjectId();
    
    // If this is a project conversation being selected within a project context
    if (projectId && conversation.projectId === projectId) {
      this.activeConversationId.set(conversation.id);
      this.selectedMode.set(conversation.mode);
      this.selectedModel.set(conversation.model);
      return;
    }
    
    // If this is a non-project conversation, clear project context
    if (!conversation.projectId) {
      this.activeProjectId.set(null);
      this.selectedFileIds.set([]);
      this.activeConversationId.set(conversation.id);
      this.selectedMode.set(conversation.mode);
      this.selectedModel.set(conversation.model);
      this.activeTab.set('home');
      return;
    }
    
    // If trying to select a conversation from a different project, prevent it
    if (projectId && conversation.projectId !== projectId) {
      console.warn('Cannot select a conversation from a different project');
      return;
    }
  }

  async deleteConversation(conversationId: string, event?: Event) {
    if (event) {
      event.stopPropagation(); // Prevent selecting the conversation when clicking delete
    }

    try {
      await this.api.deleteConversation(conversationId);
      
      // Remove from local state
      this.conversations.update((conversations) => 
        conversations.filter((c) => c.id !== conversationId)
      );

      // If the deleted conversation was active, clear selection
      if (this.activeConversationId() === conversationId) {
        this.activeConversationId.set('');
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  }

  async deleteFile(fileId: string) {
    try {
      await this.api.deleteFile(fileId);
      
      // Remove from local state
      this.files.update((files) => files.filter((f) => f.id !== fileId));
      
      // Remove from selected files if it was selected
      this.selectedFileIds.update((ids) => ids.filter((id) => id !== fileId));
      
      this.showToast('File deleted', 'success');
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file. Please try again.');
    }
  }

  async deleteProject(projectId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    if (!confirm('Delete this project and all associated conversations and outputs?')) {
      return;
    }
    
    try {
      await this.api.deleteProject(projectId);
      
      // Remove from local state
      this.projects.update((projects) => projects.filter((p) => p.id !== projectId));
      
      // Clear active project if it was deleted
      if (this.activeProjectId() === projectId) {
        this.activeProjectId.set(null);
        this.activeTemplateId.set(null);
        this.activeConversationId.set(null);
      }
      
      // Refresh conversations and artifacts to reflect deletions
      await this.refreshAll();
      
      this.showToast('Project deleted', 'success');
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    }
  }

  async renameProject(projectId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    const project = this.projects().find(p => p.id === projectId);
    if (!project) {
      return;
    }
    
    const newTitle = prompt('Enter new project name:', project.title);
    if (!newTitle || newTitle.trim() === '' || newTitle === project.title) {
      return;
    }
    
    try {
      const updatedProject = await this.api.updateProject(projectId, { title: newTitle.trim() });
      
      // Update in local state
      this.projects.update((projects) =>
        projects.map((p) => (p.id === projectId ? updatedProject : p))
      );
      
      this.showToast('Project renamed', 'success');
    } catch (error) {
      console.error('Failed to rename project:', error);
      alert('Failed to rename project. Please try again.');
    }
  }

  selectProject(project: HarnessProject) {
    this.activeProjectId.set(project.id);
    this.activeTemplateId.set(project.templateId);
    
    // Load project's attached files into selectedFileIds
    this.selectedFileIds.set(project.fileIds);
    
    // Find the template for this project
    const template = this.templates().find(t => t.id === project.templateId);
    if (template) {
      this.activeTemplate.set(template);
      this.selectedMode.set(project.mode);
      
      // Reconstruct workflowBlocks from template structure with saved values
      this.workflowBlocks.set(
        template.blocks.map((block) => ({
          ...block,
          value: project.blocks[block.id] || '',
          checked: typeof project.blocks[block.id] === 'boolean' 
            ? project.blocks[block.id] 
            : (block.checked ?? false)
        }))
      );
    }
    
    // Load project's first conversation or clear selection
    const projectConvs = this.conversations().filter(c => c.projectId === project.id);
    if (projectConvs.length > 0) {
      this.activeConversationId.set(projectConvs[0].id);
    } else {
      this.activeConversationId.set(null);
    }
    
    // Switch to projects tab to show the project workspace
    this.activeTab.set('projects');
  }

  startEditingProjectTitle() {
    const project = this.activeProject();
    if (!project) return;
    
    this.editingProjectTitle.set(project.title);
    this.isEditingProjectTitle.set(true);
    
    // Focus the input after Angular renders it
    setTimeout(() => {
      const input = document.querySelector('.project-title-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  async saveProjectTitle() {
    if (!this.isEditingProjectTitle()) return;
    
    const projectId = this.activeProjectId();
    const newTitle = this.editingProjectTitle().trim();
    
    if (!projectId || !newTitle) {
      this.cancelEditProjectTitle();
      return;
    }
    
    try {
      const updatedProject = await this.api.updateProject(projectId, { title: newTitle });
      this.projects.update(projects => 
        projects.map(p => p.id === projectId ? updatedProject : p)
      );
      this.isEditingProjectTitle.set(false);
      this.showToast('Project name updated', 'success');
    } catch (error) {
      console.error('Failed to update project title:', error);
      alert('Failed to update project name. Please try again.');
      this.cancelEditProjectTitle();
    }
  }

  cancelEditProjectTitle() {
    this.isEditingProjectTitle.set(false);
    this.editingProjectTitle.set('');
  }

  switchTab(tabId: Tab) {
    // When leaving Projects tab, clear project context to prevent file/data bleeding
    if (this.activeTab() === 'projects' && tabId !== 'projects') {
      this.activeProjectId.set(null);
      this.selectedFileIds.set([]);
    }
    
    this.activeTab.set(tabId);
  }

  async selectTemplate(template: TaskTemplate) {
    this.activeTemplate.set(template);
    this.activeTemplateId.set(template.id);
    this.workflowBlocks.set(template.blocks.map((block) => ({ ...block, value: '', checked: block.checked ?? false })));
    this.selectedMode.set(template.mode);
    this.activeWorkflowStep.set('frame'); // Reset to first step
    
    // Clear file selections - templates are read-only previews
    // Files can only be attached within project context
    this.selectedFileIds.set([]);
    
    // Just preview the template - don't create project yet
    // Project will be created when user clicks "Create Project" button
  }

  async createProjectFromTemplate() {
    const template = this.activeTemplate();
    if (!template) return;
    
    try {
      // Start with empty blocks - templates are read-only, no pre-filled values
      const blocks: Record<string, any> = {};
      template.blocks.forEach(block => {
        if (block.type === 'checkbox') {
          blocks[block.id] = block.checked ?? false;
        } else {
          blocks[block.id] = '';
        }
      });
      
      // Create project with empty fields and no files (start fresh)
      const project = await this.api.createProject({
        templateId: template.id,
        title: `${template.label} - ${new Date().toLocaleString()}`,
        mode: template.mode,
        blocks,
        fileIds: [] // Start with no files
      });
      
      this.projects.update((projects) => [project, ...projects]);
      
      // Open the project in Projects tab
      this.selectProject(project);
      
      this.showToast(`Project "${template.label}" created`, 'success');
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    }
  }

  updateBlock(blockId: string, value: string) {
    this.workflowBlocks.update((blocks) => blocks.map((block) => (block.id === blockId ? { ...block, value } : block)));
  }

  toggleCheckbox(blockId: string) {
    this.workflowBlocks.update((blocks) => 
      blocks.map((block) => 
        block.id === blockId ? { ...block, checked: !block.checked } : block
      )
    );
  }

  // TrackBy function to prevent input recreation
  trackByBlockId(index: number, block: WorkflowBlock): string {
    return block.id;
  }

  // Update a text or select block value
  updateBlockValue(blockId: string, value: string) {
    this.workflowBlocks.update(blocks =>
      blocks.map(block =>
        block.id === blockId ? { ...block, value } : block
      )
    );
    this.saveProjectBlocksDebounced();
  }

  // Update a checkbox block value
  updateCheckboxValue(blockId: string, checked: boolean) {
    this.workflowBlocks.update(blocks =>
      blocks.map(block =>
        block.id === blockId ? { ...block, checked } : block
      )
    );
    this.saveProjectBlocksDebounced();
  }

  // Debounced save to avoid excessive API calls
  private saveTimeout?: number;
  private filesSaveTimeout?: number;
  
  private saveProjectBlocksDebounced() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = window.setTimeout(() => {
      this.saveProjectBlocks();
    }, 1000); // Save 1 second after user stops typing
  }

  // Save current workflow blocks to the active project
  private async saveProjectBlocks() {
    const projectId = this.activeProjectId();
    if (!projectId) {
      // No project yet - user is just previewing template in Library
      // Don't save anything
      return;
    }

    const blocks: Record<string, any> = {};
    this.workflowBlocks().forEach(block => {
      if (block.type === 'checkbox') {
        blocks[block.id] = block.checked;
      } else {
        blocks[block.id] = block.value;
      }
    });

    try {
      await this.api.updateProject(projectId, { blocks });
    } catch (error) {
      console.error('Failed to save project blocks:', error);
    }
  }

  // Navigate to workflow step and scroll to section
  goToWorkflowStep(step: 'frame' | 'context' | 'output') {
    this.activeWorkflowStep.set(step);
    
    // Scroll to the appropriate section
    setTimeout(() => {
      let selector = '';
      if (step === 'frame') {
        selector = '.block-grid';
      } else if (step === 'context') {
        selector = '.file-picker';
      } else if (step === 'output') {
        selector = '.template-conversation';
      }
      
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  clearTemplateConversation() {
    // Clear the active conversation to start fresh
    this.activeConversationId.set(null);
    this.draft.set('');
    this.streamingContent.set('');
    this.isStreaming.set(false);
    this.showToast('Conversation cleared', 'success');
  }

  async launchWorkflow() {
    const template = this.activeTemplate();
    const blocks = this.workflowBlocks();
    
    // Separate checkbox options from regular blocks
    const textBlocks = blocks.filter(b => b.type !== 'checkbox');
    const checkboxBlocks = blocks.filter(b => b.type === 'checkbox');
    
    const filledBlocks = textBlocks
      .map((block) => `${block.label}:\n${block.value.trim() || '[not provided]'}`)
      .join('\n\n');
    
    // Build output requirements based on checkboxes
    const checkedOptions = checkboxBlocks.filter(b => b.checked);
    const uncheckedOptions = checkboxBlocks.filter(b => !b.checked);
    
    let outputInstructions = '';
    if (checkedOptions.length === 0 && uncheckedOptions.length > 0) {
      // All unchecked - only return code
      outputInstructions = 'IMPORTANT: Return ONLY the translated code. Do NOT include any documentation, examples, usage notes, or explanations.';
    } else if (checkedOptions.length > 0) {
      // Some checked
      const includeList = checkedOptions.map(b => b.label.replace('Include ', '')).join(', ');
      outputInstructions = `Include: ${includeList}.`;
      
      if (uncheckedOptions.length > 0) {
        const excludeList = uncheckedOptions.map(b => b.label.replace('Include ', '')).join(', ');
        outputInstructions += ` Do NOT include: ${excludeList}.`;
      }
    }
    
    const fileNote = this.selectedFileIds().length
      ? `Use the ${this.selectedFileIds().length} attached file(s) as source context.`
      : 'No files are attached; use only the information below.';

    this.selectedMode.set(template.mode);
    this.activeTemplateId.set(template.id);
    
    // Create or reuse conversation for this template
    if (!this.activeConversation()) {
      await this.createConversation();
    }
    
    const promptParts = [
      `Run the "${template.label}" workflow.`,
      '',
      `Desired output: ${template.output}.`,
      outputInstructions,
      fileNote,
      '',
      'Workflow inputs:',
      filledBlocks,
      '',
      'Return a polished, actionable result with clear sections and concrete next steps.'
    ].filter(Boolean);
    
    this.draft.set(promptParts.join('\n'));
    
    // Automatically send the message - TRUE LAUNCH!
    await this.sendMessage();
    
    // Scroll to bottom to show the output immediately
    this.scrollToBottom();
    
    // Stay on template tab instead of switching to chat
    // this.activeTab.set('chat');
  }

  applyTemplate(template: TaskTemplate) {
    this.selectTemplate(template);
    this.launchWorkflow();
  }

  useTemplateOnly(template: TaskTemplate) {
    this.selectedMode.set(template.mode);
    this.draft.set(`Run the "${template.label}" workflow.\n\nDesired output: ${template.output}.\n\nAsk me for any missing details before producing the final result.`);
    this.activeTab.set('projects');
  }

  toggleFile(fileId: string) {
    this.selectedFileIds.update((ids) => (ids.includes(fileId) ? ids.filter((id) => id !== fileId) : [...ids, fileId]));
    
    // Save fileIds to project if we're in a project context
    this.saveProjectFilesDebounced();
  }

  private saveProjectFilesDebounced() {
    if (this.filesSaveTimeout) {
      clearTimeout(this.filesSaveTimeout);
    }
    this.filesSaveTimeout = window.setTimeout(() => {
      this.saveProjectFiles();
    }, 500); // Save 500ms after user stops selecting files
  }

  private async saveProjectFiles() {
    const projectId = this.activeProjectId();
    if (!projectId) {
      // No project yet - user is just previewing template in Library
      return;
    }

    try {
      await this.api.updateProject(projectId, { fileIds: this.selectedFileIds() });
      
      // Update local project state
      this.projects.update((projects) =>
        projects.map((p) =>
          p.id === projectId ? { ...p, fileIds: this.selectedFileIds() } : p
        )
      );
    } catch (error) {
      console.error('Failed to save project files:', error);
    }
  }

  onTextareaKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  useQuickPrompt(prompt: { label: string; prompt: string; mode: HarnessMode }) {
    this.selectedMode.set(prompt.mode);
    this.draft.set(prompt.prompt);
  }

  copyMessage(content: string) {
    navigator.clipboard.writeText(content).then(
      () => this.showToast('Copied to clipboard', 'success'),
      () => this.showToast('Failed to copy', 'error')
    );
  }

  exportConversation() {
    const conv = this.activeConversation();
    if (!conv) return;

    const content = [
      `# ${conv.title}`,
      `Model: ${conv.model}`,
      `Mode: ${conv.mode}`,
      `Created: ${new Date(conv.createdAt).toLocaleString()}`,
      '',
      ...conv.messages.map(msg => [
        `## ${msg.role === 'user' ? 'User' : 'Assistant'} (${new Date(msg.createdAt).toLocaleString()})`,
        msg.content,
        ''
      ].join('\n'))
    ].join('\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conv.title.replace(/\s+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Conversation exported', 'success');
  }

  scrollToBottom() {
    setTimeout(() => {
      // Scroll all message containers
      const messages = document.querySelector('.messages');
      const templateMessages = document.querySelector('.template-messages');
      const projectMessages = document.querySelector('.project-messages');
      
      if (messages) {
        messages.scrollTop = messages.scrollHeight;
      }
      
      if (templateMessages) {
        templateMessages.scrollTop = templateMessages.scrollHeight;
      }
      
      if (projectMessages) {
        projectMessages.scrollTop = projectMessages.scrollHeight;
        // Also scroll the conversation into view
        const conversationSection = document.querySelector('.project-conversation');
        if (conversationSection) {
          conversationSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }, 100);
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
      createdAt: now,
      templateId: this.activeTemplateId() || undefined
    };

    // Add user message immediately
    this.patchConversationMessages(conversationId, [userMessage]);
    this.scrollToBottom();

    // Start streaming
    this.isStreaming.set(true);
    this.streamingContent.set('');

    try {
      await this.api.sendMessage(
        conversationId,
        { content: text, model: this.selectedModel(), mode: this.selectedMode(), fileIds: this.selectedFileIds() },
        (delta) => {
          // Accumulate streaming content without re-rendering everything
          this.streamingContent.update(content => content + delta);
          this.scrollToBottom();
        }
      );

      // Stream complete - refresh to get final messages from server
      const [conversations, artifacts] = await Promise.all([this.api.getConversations(), this.api.getArtifacts()]);
      this.conversations.set(conversations);
      this.artifacts.set(artifacts);
      this.previewArtifact.set(artifacts[0] || this.previewArtifact());
      this.activeConversationId.set(conversationId);
      this.isStreaming.set(false);
      this.streamingContent.set('');
      this.scrollToBottom();
      this.dismissAllLoadingToasts();
    } catch (error) {
      this.showToast(error instanceof Error ? error.message : 'Message failed', 'error');
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
      this.showToast('Files uploaded', 'success');
    } catch (error) {
      this.showToast(error instanceof Error ? error.message : 'Upload failed', 'error');
    } finally {
      this.busy.set(false);
    }
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
}
