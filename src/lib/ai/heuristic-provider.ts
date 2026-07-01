import { parsedResumeSchema, type AIProvider, type ParsedResume } from './types';

/**
 * Proveedor de respaldo SIN IA (best-effort por reglas/regex).
 * Permite que el flujo funcione sin clave de OpenAI, con calidad limitada.
 * No intenta separar datos sesgantes salvo lo evidente; deja `hidden` casi vacío.
 */

const KNOWN_TECH = [
  'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'go', 'rust', 'php', 'ruby',
  'react', 'next.js', 'node', 'node.js', 'angular', 'vue', 'svelte',
  'sql', 'postgresql', 'mysql', 'mongodb', 'redis',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'linux',
  'excel', 'power bi', 'tableau', 'sap', 'salesforce', 'figma',
];

const KNOWN_LANGUAGES = ['inglés', 'ingles', 'english', 'portugués', 'portugues', 'francés', 'frances', 'alemán', 'aleman', 'italiano', 'español', 'espanol'];

const LEVEL_REGEX = /\b(a1|a2|b1|b2|c1|c2|básico|basico|intermedio|avanzado|nativo|fluido)\b/i;

export class HeuristicProvider implements AIProvider {
  readonly name = 'heuristic';

  async parseResume(text: string): Promise<ParsedResume> {
    const lower = text.toLowerCase();

    const technicalSkills = KNOWN_TECH.filter((s) => lower.includes(s)).map(title);

    const languages = KNOWN_LANGUAGES.filter((l) => lower.includes(l)).map((l) => {
      const idx = lower.indexOf(l);
      const window = text.slice(idx, idx + 40);
      const level = window.match(LEVEL_REGEX)?.[0];
      return { language: title(l), level: level ?? null };
    });

    // Años de experiencia: busca "N años"
    const yearsMatch = lower.match(/(\d{1,2})\+?\s*(años|anos|years)/);
    const yearsExperience = yearsMatch ? Number(yearsMatch[1]) : null;

    const summary = text.trim().slice(0, 280) || null;

    const parsed = {
      visible: {
        summary,
        yearsExperience,
        technicalSkills: dedupe(technicalSkills),
        softSkills: [],
        languages: dedupeLanguages(languages),
        certifications: [],
        educationLevel: null,
        degrees: [],
        positions: [],
        locationCity: null,
        locationCountry: null,
      },
      hidden: {
        fullName: null,
        hasPhoto: false,
        age: null,
        gender: null,
        institutions: [],
        specificAddress: null,
      },
    };

    return parsedResumeSchema.parse(parsed);
  }
}

function title(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items));
}

function dedupeLanguages(items: { language: string; level: string | null }[]) {
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = i.language.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
