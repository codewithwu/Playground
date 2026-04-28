import fs from 'node:fs/promises';
import path from 'node:path';
import { getTemplate } from './templates/registry.js';
import type { BuiltinTemplate, RenderInput } from './types.js';

export function normalizeInlineTitle(title: string) {
  return String(title ?? '').replace(/\\n/g, '\n').trim();
}

function normalizeOptionalInlineText(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const normalized = normalizeInlineTitle(value);
  return normalized || undefined;
}

function normalizeInlineBullets(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const bullets = value.map((item) => normalizeOptionalInlineText(item)).filter((item): item is string => Boolean(item));
  return bullets.length > 0 ? bullets : undefined;
}

export function buildInlineInput(template: BuiltinTemplate, title: string, overrides: Partial<RenderInput> = {}): RenderInput {
  return getTemplate(template).schema.parse({
    ...overrides,
    subtitle: normalizeOptionalInlineText(overrides.subtitle),
    bullets: normalizeInlineBullets(overrides.bullets),
    footer: normalizeOptionalInlineText(overrides.footer),
    icon: normalizeOptionalInlineText(overrides.icon),
    label: normalizeOptionalInlineText(overrides.label),
    day: normalizeOptionalInlineText(overrides.day),
    serial: normalizeOptionalInlineText(overrides.serial),
    title: normalizeInlineTitle(title),
  });
}

export async function loadInput(dataPath: string, template: BuiltinTemplate): Promise<RenderInput> {
  const raw = await fs.readFile(path.resolve(dataPath), 'utf8');
  const json = JSON.parse(raw);
  return getTemplate(template).schema.parse(json);
}
