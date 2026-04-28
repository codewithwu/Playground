import type { TemplateDefinition } from './types.js';
import { commonSchema } from './schemas.js';
import { resolveTemplateTitleLayout } from './title-engine.js';

const PAGE_BG = '#F5F4F0';
const RULE_COLOR = 'rgba(114, 142, 168, 0.18)';
const TEXT_COLOR = '#111111';
const BLUE_HIGHLIGHT = '#B9E7FF';
const ORANGE_UNDERLINE = '#F0A25F';

function formatTodayLabel() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${month}.${day}`;
}

function ScribbleSmile() {
  return (
    <svg width="196" height="190" viewBox="0 0 196 190" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M36 92C34 60 58 30 96 26C132 23 160 44 165 79C170 112 152 141 124 153C92 167 54 152 41 123" stroke="#111111" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M43 88C40 109 46 129 59 143" stroke="#111111" strokeWidth="2.6" strokeLinecap="round" opacity="0.75" />
      <path d="M66 74C71 69 77 69 82 74" stroke="#111111" strokeWidth="3.8" strokeLinecap="round" />
      <path d="M111 75C116 70 123 70 128 75" stroke="#111111" strokeWidth="3.8" strokeLinecap="round" />
      <path d="M68 109C82 121 106 123 126 110" stroke="#111111" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M73 116C87 124 105 124 119 115" stroke="#111111" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
      <circle cx="67" cy="78" r="2.8" fill="#111111" />
      <circle cx="123" cy="79" r="2.8" fill="#111111" />
    </svg>
  );
}

export const xhsDateNoteTemplate: TemplateDefinition = {
  name: 'xhs-date-note',
  description: '横线纸手写文案卡片（左上角自动当天日期）',
  defaultWidth: 1080,
  defaultHeight: 1440,
  examplePath: 'examples/xhs-date-note.json',
  preferredFontRegularPath: 'fonts/custom/LXGWMarkerGothic-Regular.ttf',
  schema: commonSchema,
  render: (input) => {
    const titleLayout = input.__resolvedTitleLayout ?? resolveTemplateTitleLayout('xhs-date-note', input);
    const titleLines = titleLayout.lines;
    const todayLabel = formatTodayLabel();
    const lineHeightPx = Math.round(titleLayout.fontSize * titleLayout.lineHeight);
    const titleTop = 442;
    const titleLeft = 158;
    const titleGap = 16;

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative' as any,
          overflow: 'hidden',
          background: PAGE_BG,
          color: TEXT_COLOR,
        }}
      >
        {Array.from({ length: 16 }).map((_, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute' as any,
              left: 0,
              right: 0,
              top: 120 + idx * 84,
              height: 3,
              background: RULE_COLOR,
            }}
          />
        ))}

        <div
          style={{
            position: 'absolute' as any,
            left: 74,
            top: 68,
            display: 'flex',
            alignItems: 'flex-end',
            fontSize: 42,
            fontWeight: 500,
            letterSpacing: -0.5,
            transform: 'rotate(-1.5deg)',
          }}
        >
          <div style={{ display: 'flex', fontFamily: 'XFont' }}>Date:</div>
          <div style={{ display: 'flex', marginLeft: 14, fontFamily: 'XFont', fontSize: 48 }}>{todayLabel}</div>
        </div>

        <div
          style={{
            position: 'absolute' as any,
            left: 188,
            top: 128,
            width: 138,
            height: 3,
            background: '#111111',
            borderRadius: 999,
            transform: 'rotate(-1deg)',
          }}
        />

        {titleLines.map((line, idx) => {
          const isLast = idx === titleLines.length - 1;
          const highlightWidth = Math.min(Math.max((titleLayout.lineWidths[idx] ?? 420) + 92, 540), 920);
          const top = titleTop + idx * (lineHeightPx + titleGap);
          const rotate = idx === 0 ? -1.2 : idx === 1 ? -0.55 : -0.85;
          const underlineWidth = Math.min(Math.max((titleLayout.lineWidths[idx] ?? 300) * 0.76, 260), 460);
          const underlineLeft = Math.max(16, ((titleLayout.lineWidths[idx] ?? 300) - underlineWidth) * 0.5 + 26);

          return (
            <div key={idx} style={{ position: 'absolute' as any, left: titleLeft, top, display: 'flex' }}>
              <div
                style={{
                  position: 'absolute' as any,
                  left: -26,
                  top: 22,
                  width: highlightWidth,
                  height: lineHeightPx - 24,
                  background: BLUE_HIGHLIGHT,
                  borderRadius: 999,
                  opacity: idx === 0 ? 0.94 : 0.9,
                  transform: `rotate(${idx % 2 === 0 ? 0.9 : -0.7}deg)`,
                }}
              />
              <div
                style={{
                  position: 'relative' as any,
                  display: 'flex',
                  alignItems: 'flex-end',
                  fontSize: titleLayout.fontSize,
                  lineHeight: titleLayout.lineHeight,
                  fontWeight: 500,
                  letterSpacing: 1.2,
                  transform: `rotate(${rotate}deg)`,
                  transformOrigin: 'left bottom',
                  whiteSpace: 'nowrap',
                }}
              >
                {line}
              </div>
              {isLast ? (
                <div
                  style={{
                    position: 'absolute' as any,
                    left: underlineLeft,
                    top: lineHeightPx + 10,
                    width: underlineWidth,
                    height: 14,
                    background: ORANGE_UNDERLINE,
                    borderRadius: 999,
                    transform: 'rotate(-1.4deg)',
                  }}
                />
              ) : null}
            </div>
          );
        })}

        <div
          style={{
            position: 'absolute' as any,
            right: 82,
            bottom: 72,
            display: 'flex',
            transform: 'rotate(4deg)',
            opacity: 0.95,
          }}
        >
          <ScribbleSmile />
        </div>
      </div>
    );
  },
};
