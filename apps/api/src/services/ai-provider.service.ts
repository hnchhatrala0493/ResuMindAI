/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { env } from '../config/env.js';
import { HttpError } from '../utilities/http-error.js';
export type AIRequest = { system: string; content: string; signal?: AbortSignal };
export type AIResponse<T> = {
  data: T;
  requestId: string;
  provider: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
};
export interface AIProvider {
  generateStructuredResponse<T>(request: AIRequest, schema: z.ZodType<T>): Promise<AIResponse<T>>;
}
const parse = <T>(raw: string, schema: z.ZodType<T>) => {
  try {
    return schema.parse(JSON.parse(raw.replace(/^```json\s*|\s*```$/g, '')));
  } catch {
    throw new HttpError(
      502,
      'AI_INVALID_RESPONSE',
      'The AI provider returned an invalid response.',
    );
  }
};
class MockProvider implements AIProvider {
  async generateStructuredResponse<T>(r: AIRequest, s: z.ZodType<T>) {
    const original = r.content.slice(0, 500);
    const data = parse(
      JSON.stringify({
        suggestedContent: `Strengthened: ${original.replace(/<[^>]+>/g, '').slice(0, 300)}`,
        explanation: 'Uses clearer, outcome-oriented language without inventing facts.',
        confidence: 0.9,
        warnings: ['Replace bracketed placeholders with verified facts.'],
      }),
      s,
    );
    return {
      data,
      requestId: randomUUID(),
      provider: 'mock',
      model: env.AI_MODEL,
      usage: {
        inputTokens: Math.ceil(r.content.length / 4),
        outputTokens: 40,
        totalTokens: Math.ceil(r.content.length / 4) + 40,
      },
    };
  }
}
class HttpProvider implements AIProvider {
  constructor(private kind: 'openai' | 'gemini') {}
  async generateStructuredResponse<T>(r: AIRequest, s: z.ZodType<T>) {
    const requestId = randomUUID(),
      controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);
    r.signal?.addEventListener('abort', () => controller.abort(), { once: true });
    const key =
      env.AI_API_KEY ?? (this.kind === 'openai' ? env.OPENAI_API_KEY : env.GEMINI_API_KEY)!;
    try {
      let response: Response;
      if (this.kind === 'openai')
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${key}`,
            'content-type': 'application/json',
            'x-request-id': requestId,
          },
          body: JSON.stringify({
            model: env.AI_MODEL,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: r.system },
              { role: 'user', content: r.content },
            ],
          }),
          signal: controller.signal,
        });
      else
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${env.AI_MODEL}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: r.system }] },
              contents: [{ parts: [{ text: r.content }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
            signal: controller.signal,
          },
        );
      if (!response.ok)
        throw new HttpError(
          response.status === 429 ? 429 : 502,
          response.status === 429 ? 'AI_RATE_LIMITED' : 'AI_UNAVAILABLE',
          'The AI provider is temporarily unavailable.',
        );
      const j = (await response.json()) as any;
      const raw =
        this.kind === 'openai'
          ? j.choices?.[0]?.message?.content
          : j.candidates?.[0]?.content?.parts?.[0]?.text;
      const u = this.kind === 'openai' ? j.usage : j.usageMetadata;
      const input = Number(u?.prompt_tokens ?? u?.promptTokenCount ?? 0),
        output = Number(u?.completion_tokens ?? u?.candidatesTokenCount ?? 0);
      return {
        data: parse(String(raw), s),
        requestId,
        provider: this.kind,
        model: env.AI_MODEL,
        usage: {
          inputTokens: input,
          outputTokens: output,
          totalTokens: Number(u?.total_tokens ?? u?.totalTokenCount ?? input + output),
        },
      };
    } catch (e) {
      if (e instanceof HttpError) throw e;
      if ((e as Error).name === 'AbortError')
        throw new HttpError(504, 'AI_TIMEOUT', 'The AI request timed out.');
      throw new HttpError(502, 'AI_UNAVAILABLE', 'The AI provider is temporarily unavailable.');
    } finally {
      clearTimeout(timeout);
    }
  }
}
export const aiProvider: AIProvider =
  env.AI_PROVIDER === 'mock' ? new MockProvider() : new HttpProvider(env.AI_PROVIDER);
