// Builds dist/resume.pdf (and copies resume.md next to it) from resume.md and resume.css.
// It also builds dist/resume-public.pdf, the same resume without the email address, for
// putting on a website where bots scrape it.
//
// The Markdown becomes HTML (raw HTML in it is kept), the CSS styles it, and headless Chrome
// prints it. If the resume runs past one page, it is scaled down a little at a time until it
// fits. Chrome is found from CHROME_PATH, or in the usual install locations.
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { micromark } from "micromark";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "dist");
const source = readFileSync(join(root, "resume.md"), "utf8");
// The email and the bullet before it, whether plain text or a mailto link.
const emailPattern = /\s*&bull;\s*(?:<a [^>]*mailto:[^>]*>[^<]*<\/a>|[\w.+-]+@[\w.-]+\.\w+)/g;
const variants = [
  { name: "resume.pdf", markdown: source },
  { name: "resume-public.pdf", markdown: source.replace(emailPattern, "") },
];

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];
const chrome = chromeCandidates.find((path) => path && existsSync(path));
if (!chrome) throw new Error("Chrome not found. Set CHROME_PATH to a Chrome or Edge executable.");

const css = readFileSync(join(root, "resume.css"), "utf8");

const work = mkdtempSync(join(tmpdir(), "resume-"));
mkdirSync(outDir, { recursive: true });
// The source goes in the package too, for job-hunter to read.
copyFileSync(join(root, "resume.md"), join(outDir, "resume.md"));

try {
  for (const { name, markdown } of variants) build(name, markdown);
} finally {
  rmSync(work, { recursive: true, force: true });
}

function build(name, markdown) {
  const out = join(outDir, name);
  // Single newlines inside a paragraph become line breaks, as in the VS Code preview.
  const body = micromark(markdown, { allowDangerousHtml: true }).replace(
    /<p>[\s\S]*?<\/p>/g,
    (paragraph) => paragraph.replace(/\n/g, "<br>\n"),
  );
  // Zoom 1 down to 0.8: the largest size that fits on one page.
  for (let zoom = 1; zoom >= 0.8; zoom = Math.round((zoom - 0.02) * 100) / 100) {
    const html = join(work, "resume.html");
    writeFileSync(html, page(body, zoom));
    rmSync(out, { force: true });
    spawnSync(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        `--user-data-dir=${join(work, "profile")}`,
        "--no-pdf-header-footer",
        "--virtual-time-budget=15000",
        `--print-to-pdf=${out}`,
        pathToFileURL(html).href,
      ],
      { stdio: "ignore" },
    );
    if (!existsSync(out)) throw new Error("Chrome didn't write a PDF.");
    const pages =
      readFileSync(out)
        .toString("latin1")
        .match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
    if (pages <= 1) {
      console.log(`[resume] built dist/${name} (1 page, zoom ${zoom})`);
      return;
    }
  }
  throw new Error("The resume doesn't fit on one page, even at 80%. Shorten it.");
}

function page(body, zoom) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Connor Hergott - Resume</title>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,600;0,700;1,400&family=Raleway:wght@300;600;700&display=swap" rel="stylesheet">
<style>${css}
@media print { html { zoom: ${zoom}; } }</style></head><body>${body}</body></html>`;
}
