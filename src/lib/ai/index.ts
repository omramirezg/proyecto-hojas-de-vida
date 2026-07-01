import { OpenAIProvider } from './openai-provider';
import { HeuristicProvider } from './heuristic-provider';
import type { AIProvider } from './types';

export type { AIProvider, ParsedResume, ParsedVisible, ParsedHidden } from './types';

export function isAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Selección de proveedor:
 *  - OpenAI si hay OPENAI_API_KEY.
 *  - Heurístico (best-effort) en caso contrario, para no bloquear el flujo.
 */
export function getAIProvider(): AIProvider {
  const key = process.env.OPENAI_API_KEY;
  if (key) return new OpenAIProvider(key);
  return new HeuristicProvider();
}
