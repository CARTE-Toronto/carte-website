#!/usr/bin/env node
// Design-system conformance check for carte.utoronto.ca.
// Pattern checks only: each rule is a regex the source must NOT match.
// Source of truth: ../carte-design-system/project/readme.md (hard rules).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN = ['src/pages', 'src/components', 'src/layouts', 'src/styles'];

const RULES = [
  { id: 'no-shadow', re: /(?<![-\w])(hover:)?shadow-(xs|sm|md|lg|xl|2xl)\b/, why: 'No drop shadows. Depth = border + surface + spacing.' },
  { id: 'no-gradient', re: /bg-gradient-to-[a-z]+(?![^\n]*to-transparent)/, why: 'No gradients (scroll-fade masks to transparent are the one exception).' },
  { id: 'no-body-colour-override', re: /<body[^>]*\btext-slate-\d+/, why: 'Body colour comes from --text-body, not a utility on <body>.' },
  { id: 'no-accent-icons', re: /text-accent-(purple|teal|warm-red|fuchsia|cool-blue|dark-green|yellow|light-green)/, why: 'Icons and text are monochrome: --brand-primary, --brand-secondary, or --text-subtle.' },
  { id: 'no-accent-wash', re: /^(?!.*funding-visual).*bg-(accent-[a-z-]+|secondary-blue)\/1[05]\b/, why: 'Tinted tiles use --surface-sunken / --surface-info, not ad-hoc accent washes.' },
  { id: 'no-left-rule', re: /border-l-4/, why: '1px hairline is the only chrome border; 4px accent rules are not a pattern.' },
  { id: 'no-extrabold-h2', re: /<h[2-6][^>]*font-extrabold/, why: 'H2-H4 are weight 700; only display and H1 are 800.' },
  { id: 'no-arrow-on-pill', re: /<slot \/> →/, why: 'The → arrow belongs to .link-arrow, not pill buttons.' },
  { id: 'no-exclamation-feedback', re: /subscribed!/, why: 'No exclamation marks in UX copy.' },
  { id: 'no-title-case-buttons', re: />(Partner With Us|Build AI Skills|Get in Touch|Explore Training|Contact Us|View All Training Programs|Subscribe to Mailing List|Submit Your CV|Learn More About Mitacs|Get Funding Support|Explore Available Projects)</, why: 'Buttons are sentence case and imperative.' },
  { id: 'no-title-case-stats', re: /class="lbl">(Professionals Trained|Sectors Served|Student Community|Applied AI Projects)</, why: 'Labels are sentence case.' },
  { id: 'no-slate-body-copy', re: /<p[^>]*\btext-slate-(500|600|700|800|900)\b/, why: 'Paragraph copy uses --text-body / --text-muted / --text-subtle; slate is UI chrome only.' },
  { id: 'no-nested-main', re: /<main\b/, only: /src\/components\//, why: 'One <main> landmark per page; it lives in BaseLayout.' },
  { id: 'no-outline-none', re: /\bfocus:outline-none\b/, why: 'Keep the global :focus-visible ring; never remove the outline.' },
  { id: 'no-literal-hex', re: /(?<![\w-])#[0-9a-fA-F]{6}\b/, only: /src\/(pages|components)\//, skip: /^\s*(\/\/|\*)/, why: 'Colours come from tokens (var(--…)), not literals.' },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(astro|css)$/.test(name)) out.push(p);
  }
  return out;
}

const files = SCAN.flatMap((d) => walk(join(ROOT, d)));
const findings = [];
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.only && !rule.only.test(file)) continue;
      if (rule.skip && (rule.skip.test(line) || rule.skip.test(file))) continue;
      if (rule.re.test(line)) findings.push({ file: relative(ROOT, file), line: i + 1, id: rule.id, why: rule.why });
    }
  });
}

if (findings.length) {
  const byRule = {};
  for (const f of findings) (byRule[f.id] ||= []).push(f);
  for (const [id, list] of Object.entries(byRule)) {
    console.log(`\n[${id}] ${list[0].why}`);
    for (const f of list.slice(0, 8)) console.log(`  ${f.file}:${f.line}`);
    if (list.length > 8) console.log(`  … ${list.length - 8} more`);
  }
  console.log(`\n${findings.length} finding(s) across ${Object.keys(byRule).length} rule(s).`);
  process.exit(1);
}
console.log(`Design check passed: ${files.length} files, ${RULES.length} rules.`);
