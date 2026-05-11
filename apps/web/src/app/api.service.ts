import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { HarnessArtifact, HarnessConversation, HarnessFile, HarnessMode, HarnessProject, ModelList, Settings } from './types';

const apiBase = '/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  getSettings() {
    return firstValueFrom(this.http.get<Settings>(`${apiBase}/settings`));
  }

  saveSettings(payload: { openaiApiKey?: string; defaultModel: string }) {
    return firstValueFrom(this.http.put<Settings>(`${apiBase}/settings`, payload));
  }

  getModels() {
    return firstValueFrom(this.http.get<ModelList>(`${apiBase}/models`));
  }

  getFiles() {
    return firstValueFrom(this.http.get<HarnessFile[]>(`${apiBase}/files`));
  }

  getArtifacts() {
    return firstValueFrom(this.http.get<HarnessArtifact[]>(`${apiBase}/artifacts`));
  }

  uploadFiles(files: FileList) {
    const form = new FormData();
    Array.from(files).forEach((file) => form.append('files', file));
    return firstValueFrom(this.http.post<HarnessFile[]>(`${apiBase}/files`, form));
  }

  getConversations() {
    return firstValueFrom(this.http.get<HarnessConversation[]>(`${apiBase}/conversations`));
  }

  createConversation(payload: { title: string; model: string; mode: HarnessMode; projectId?: string }) {
    return firstValueFrom(this.http.post<HarnessConversation>(`${apiBase}/conversations`, payload));
  }

  deleteConversation(conversationId: string) {
    return firstValueFrom(this.http.delete(`${apiBase}/conversations/${conversationId}`));
  }

  deleteFile(fileId: string) {
    return firstValueFrom(this.http.delete(`${apiBase}/files/${fileId}`));
  }

  getProjects() {
    return firstValueFrom(this.http.get<HarnessProject[]>(`${apiBase}/projects`));
  }

  getProject(projectId: string) {
    return firstValueFrom(this.http.get<HarnessProject & { conversations: HarnessConversation[]; files: HarnessFile[]; artifacts: HarnessArtifact[] }>(`${apiBase}/projects/${projectId}`));
  }

  createProject(payload: { templateId: string; title: string; mode: HarnessMode; blocks: Record<string, any>; fileIds: string[] }) {
    return firstValueFrom(this.http.post<HarnessProject>(`${apiBase}/projects`, payload));
  }

  updateProject(projectId: string, payload: { title: string }) {
    return firstValueFrom(this.http.put<HarnessProject>(`${apiBase}/projects/${projectId}`, payload));
  }

  deleteProject(projectId: string) {
    return firstValueFrom(this.http.delete(`${apiBase}/projects/${projectId}`));
  }

  async sendMessage(
    conversationId: string,
    payload: { content: string; model: string; mode: HarnessMode; fileIds: string[] },
    onDelta: (text: string) => void
  ) {
    const response = await fetch(`${apiBase}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok || !response.body) {
      throw new Error(`Message request failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalMessage = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const eventBlock of events) {
        const eventName = eventBlock.match(/^event: (.+)$/m)?.[1];
        const dataLine = eventBlock.match(/^data: (.+)$/m)?.[1];

        if (!eventName || !dataLine) {
          continue;
        }

        const data = JSON.parse(dataLine);

        if (eventName === 'delta') {
          onDelta(data.text);
        }

        if (eventName === 'done') {
          finalMessage = data.message;
        }
      }
    }

    return finalMessage;
  }
}
