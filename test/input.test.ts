import { describe, expect, it } from 'vitest';
import { buildInlineInput, normalizeInlineTitle } from '../src/input.js';

describe('input helpers', () => {
  it('normalizes escaped newlines in inline title', () => {
    expect(normalizeInlineTitle('第一行\\n第二行')).toBe('第一行\n第二行');
  });

  it('builds render input from title only', () => {
    const input = buildInlineInput('xhs-note', '第一行\\n第二行');

    expect(input).toMatchObject({
      title: '第一行\n第二行',
    });
  });

  it('keeps optional overrides when building inline input', () => {
    const input = buildInlineInput('xhs-note', '只是一个标题', { theme: 'blue' });

    expect(input.theme).toBe('blue');
  });

  it('normalizes optional inline fields and bullets', () => {
    const input = buildInlineInput('xhs-note', '第一行\\n第二行', {
      subtitle: '副标题\\n第二行',
      bullets: [' 第一条 ', '', '第二条\\n补充'],
      footer: ' 页脚 ',
      icon: ' 💡 ',
      label: ' Text Note ',
      day: ' Wednesday ',
      serial: ' 01 ',
      theme: 'cream',
    });

    expect(input).toMatchObject({
      title: '第一行\n第二行',
      subtitle: '副标题\n第二行',
      bullets: ['第一条', '第二条\n补充'],
      footer: '页脚',
      icon: '💡',
      label: 'Text Note',
      day: 'Wednesday',
      serial: '01',
      theme: 'cream',
    });
  });
});
