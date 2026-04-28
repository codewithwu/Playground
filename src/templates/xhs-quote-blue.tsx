import type { TemplateDefinition } from './types.js';
import { commonSchema } from './schemas.js';
import { resolveTemplateTitleLayout } from './title-engine.js';

export const xhsQuoteBlueTemplate: TemplateDefinition = {
  name: 'xhs-quote-blue',
  description: '浅蓝极简引用风小红书卡片',
  defaultWidth: 1080,
  defaultHeight: 1440,
  examplePath: 'examples/xhs-quote-blue.json',
  schema: commonSchema,
  render: (input) => {
    const titleLayout = input.__resolvedTitleLayout ?? resolveTemplateTitleLayout('xhs-quote-blue', input);
    const titleLines = titleLayout.lines;

    const lineCount = titleLines.length;
    const titleBlockHeight = lineCount * titleLayout.fontSize * titleLayout.lineHeight + Math.max(0, lineCount - 1) * 42;
    const titleTop = Math.max(250, Math.round((1440 - titleBlockHeight) / 2));
    const quoteTop = Math.max(90, titleTop - 190);
    const titleGap = lineCount <= 2 ? 60 : lineCount === 3 ? 52 : 44;
    const highlightWidth = Math.min(Math.max((titleLayout.lineWidths[lineCount - 1] ?? 220) * 0.42, 180), 320);

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#D7EAF4',
          color: '#2E3138',
          position: 'relative' as any,
        }}
      >
        <div
          style={{
            position: 'absolute' as any,
            left: 110,
            top: quoteTop,
            display: 'flex',
            fontSize: 152,
            lineHeight: 0.9,
            fontWeight: 900,
            letterSpacing: -4,
            color: '#B6D5E6',
            opacity: 0.95,
          }}
        >
          “
        </div>

        <div
          style={{
            position: 'absolute' as any,
            left: 118,
            top: titleTop,
            width: 760,
            display: 'flex',
            flexDirection: 'column',
            gap: titleGap,
          }}
        >
          {titleLines.map((line, idx) => {
            const isLast = idx === titleLines.length - 1;
            return (
              <div key={idx} style={{ display: 'flex', position: 'relative' as any, alignItems: 'flex-end' }}>
                {isLast ? (
                  <div
                    style={{
                      position: 'absolute' as any,
                      left: 2,
                      bottom: 10,
                      width: highlightWidth,
                      height: 46,
                      background: '#EDB1E5',
                    }}
                  />
                ) : null}
                <div
                  style={{
                    display: 'flex',
                    position: 'relative' as any,
                    fontSize: titleLayout.fontSize,
                    lineHeight: titleLayout.lineHeight + (lineCount >= 3 ? 0.04 : 0.02),
                    letterSpacing: -6,
                    fontWeight: 900,
                    color: '#32353B',
                    whiteSpace: 'nowrap',
                    flexWrap: 'nowrap',
                    overflow: 'hidden',
                    maxWidth: '100%',
                  }}
                >
                  {line}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    );
  },
};
