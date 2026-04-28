import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const rootDir = process.cwd();
const outDir = path.resolve(process.env.RELEASE_SHOWCASE_OUT_DIR || 'release-showcase');

const fallbackSansFont = {
  regular: 'fonts/custom/LXGWWenKaiLite-Regular.ttf',
  bold: 'fonts/custom/LXGWWenKaiLite-Regular.ttf',
};

const templates = [
  {
    key: 'xhs-note',
    title: 'xhs-note',
    template: 'xhs-note',
    data: 'website/data/xhs-note.json',
    fileName: 'xhs-note.png',
  },
  {
    key: 'xhs-note-green',
    title: 'xhs-note-green',
    template: 'xhs-note-green',
    data: 'website/data/xhs-note-green.json',
    fileName: 'xhs-note-green.png',
  },
  {
    key: 'xhs-quote-blue',
    title: 'xhs-quote-blue',
    template: 'xhs-quote-blue',
    data: 'website/data/xhs-quote-blue.json',
    fileName: 'xhs-quote-blue.png',
  },
  {
    key: 'apple-notes-handwrite',
    title: 'apple-notes-handwrite',
    template: 'apple-notes-handwrite',
    data: 'examples/apple-notes-handwrite.json',
    fileName: 'apple-notes-handwrite.png',
    fontRegular: 'fonts/custom/LXGWMarkerGothic-Regular.ttf',
  },
  {
    key: 'xhs-date-note',
    title: 'xhs-date-note',
    template: 'xhs-date-note',
    data: 'examples/xhs-date-note.json',
    fileName: 'xhs-date-note.png',
    fontRegular: 'fonts/custom/LXGWMarkerGothic-Regular.ttf',
  },
];

async function loadReleaseInput(item) {
  const sourcePath = path.resolve(rootDir, item.data);
  const raw = await fs.readFile(sourcePath, 'utf8');
  return JSON.parse(raw);
}

function pushInlineInputArgs(args, input) {
  if (typeof input.title !== 'string' || input.title.trim().length === 0) {
    throw new Error('Release showcase input requires a non-empty title');
  }

  args.push('--title', input.title);

  if (typeof input.subtitle === 'string' && input.subtitle.trim()) {
    args.push('--subtitle', input.subtitle);
  }

  if (Array.isArray(input.bullets)) {
    for (const bullet of input.bullets) {
      if (typeof bullet === 'string' && bullet.trim()) {
        args.push('--bullet', bullet);
      }
    }
  }

  if (typeof input.footer === 'string' && input.footer.trim()) {
    args.push('--footer', input.footer);
  }

  if (typeof input.theme === 'string' && input.theme.trim()) {
    args.push('--theme', input.theme);
  }

  if (typeof input.icon === 'string' && input.icon.trim()) {
    args.push('--icon', input.icon);
  }

  if (typeof input.label === 'string' && input.label.trim()) {
    args.push('--label', input.label);
  }

  if (typeof input.day === 'string' && input.day.trim()) {
    args.push('--day', input.day);
  }

  if (typeof input.serial === 'string' && input.serial.trim()) {
    args.push('--serial', input.serial);
  }
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  const defaultFonts = {
    regular: path.resolve(rootDir, fallbackSansFont.regular),
    bold: path.resolve(rootDir, fallbackSansFont.bold),
  };

  for (const item of templates) {
    const outPath = path.join(outDir, item.fileName);
    const releaseInput = await loadReleaseInput(item);
    const fontRegular = item.fontRegular ? path.resolve(rootDir, item.fontRegular) : defaultFonts.regular;
    const fontBold = item.fontBold ? path.resolve(rootDir, item.fontBold) : defaultFonts.bold;
    const args = [
      'dist/cli.js',
      'render',
      '--template',
      item.template,
      '--title-layout-mode',
      'rule',
      '--out',
      outPath,
      '--font',
      fontRegular,
    ];

    pushInlineInputArgs(args, releaseInput);

    if (fontBold) {
      args.push('--fontBold', fontBold);
    }

    await execFileAsync('node', args, { cwd: rootDir });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    gitRef: process.env.GITHUB_REF ?? null,
    gitSha: process.env.GITHUB_SHA ?? null,
    repository: process.env.GITHUB_REPOSITORY ?? null,
    templates: templates.map((item) => ({
      key: item.key,
      title: item.title,
      template: item.template,
      fileName: item.fileName,
      data: item.data,
    })),
  };

  await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  process.stdout.write(JSON.stringify({ outDir, templates: manifest.templates }, null, 2) + '\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
