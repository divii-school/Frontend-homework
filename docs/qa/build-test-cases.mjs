// Builds docs/qa/HW3-Pranesh-unit-test-cases.csv (UTF-8 with BOM, opens in Google Sheets / Excel).
//
// The case list is docs/qa/test-cases.data.mjs. Actual Result, Pass / Fail and Last Run Date come
// from the real test output, never typed by hand:
//   docs/qa/evidence/playwright-local.json   npx playwright test --project=readonly --project=mutation (JSON reporter)
//   docs/qa/evidence/playwright-vercel.json  the readonly project against the Vercel URL
//   docs/qa/evidence/vitest.json             npx vitest run --reporter=json
// Every test a row names must exist in that output; if one is missing the build stops.
//
// Run: node docs/qa/build-test-cases.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { cases } from './test-cases.data.mjs';

const here = (file) => new URL(file, import.meta.url);
const load = (file) => JSON.parse(readFileSync(here(file), 'utf8'));
const firstLine = (text) =>
  String(text ?? '').replace(/\u001b\[[0-9;]*m/g, '').split('\n').find((l) => l.trim())?.trim().slice(0, 200) ?? '';
const kstDate = (ms) => new Date(ms + 9 * 3600 * 1000).toISOString().slice(0, 10);

// ── Playwright JSON → map "file › describe › title" → { status, steps, project }[] ─────────────
function indexPlaywright(report) {
  const tests = new Map();
  const walk = (suite, path) => {
    for (const spec of suite.specs ?? []) {
      const key = [...path, spec.title].join(' › ');
      for (const t of spec.tests) {
        const result = t.results.at(-1) ?? {};
        const entry = { project: t.projectName, ok: t.status === 'expected', status: t.status, steps: result.steps ?? [], error: result.error?.message };
        tests.set(key, [...(tests.get(key) ?? []), entry]);
      }
    }
    for (const child of suite.suites ?? []) walk(child, [...path, child.title]);
  };
  for (const fileSuite of report.suites) walk(fileSuite, [fileSuite.title.split(/[\\/]/).pop()]);
  return { tests, date: kstDate(Date.parse(report.stats.startTime)) };
}

function findStep(steps, prefix) {
  for (const s of steps) {
    if (s.title.startsWith(prefix)) return s;
    const inner = findStep(s.steps ?? [], prefix);
    if (inner) return inner;
  }
  return null;
}

// ── Vitest JSON → map "src/x.test.ts > describe > title" → status ──────────────────────────────
function indexVitest(report) {
  const tests = new Map();
  for (const file of report.testResults) {
    const rel = file.name.replace(/\\/g, '/').replace(/^.*?\/src\//, 'src/');
    for (const a of file.assertionResults) tests.set([rel, ...a.ancestorTitles, a.title].join(' > '), a);
  }
  return { tests, date: kstDate(report.startTime) };
}

const local = indexPlaywright(load('./evidence/playwright-local.json'));
// A test that failed once in the full run is run again on its own; its re-run result replaces the
// first one, and the row says so, with the reason found in that run's trace (RERUN_REASONS).
const rerunFile = './evidence/playwright-local-rerun.json';
const rerun = existsSync(here(rerunFile)) ? indexPlaywright(load(rerunFile)) : null;
const firstRunFailures = new Map();
const RERUN_REASONS = {
  'product-form.spec.ts › 상품 수정 (read only, saves answered here) › edit: 취소 after a change asks first, then returns to the details page unchanged':
    { en: 'after 예 the server answered but the page did not switch; build report §8', ko: '예 클릭 후 화면 전환 미완료, 빌드 보고서 §8' },
};
const reasonOf = (key) => RERUN_REASONS[key] ?? { en: 'the shared QA session was refused mid-run, A4', ko: '공용 QA 세션 거부, A4' };
if (rerun) {
  for (const [key, entries] of rerun.tests) {
    const before = local.tests.get(key);
    if (before?.some((e) => !e.ok)) firstRunFailures.set(key, firstLine(before.find((e) => !e.ok).error));
    local.tests.set(key, entries);
  }
}
const vercel = existsSync(here('./evidence/playwright-vercel.json')) ? indexPlaywright(load('./evidence/playwright-vercel.json')) : null;
const unitRun = indexVitest(load('./evidence/vitest.json'));

/** Resolves one reference against a run. Returns { ok, label, error } or throws if it does not exist. */
function resolve(ref, run, { optional = false } = {}) {
  const [kind, rest] = [ref.slice(0, ref.indexOf(':')), ref.slice(ref.indexOf(':') + 1)];
  if (kind === 'pw' || kind === 'step') {
    const parts = rest.split(' › ');
    const stepPrefix = kind === 'step' ? parts.pop() : null;
    const key = parts.join(' › ');
    const entries = run.tests.get(key);
    if (!entries) {
      if (optional) return null;
      throw new Error(`Playwright test not found: ${key}`);
    }
    if (kind === 'pw') {
      const ok = entries.every((e) => e.ok);
      const rerunOf = run === local ? firstRunFailures.get(key) : undefined;
      const note =
        rerunOf === undefined ? '' : ` — failed once in the full run (${reasonOf(key).en}); passed when run again on its own`;
      return { ok, rerun: rerunOf !== undefined, rerunKey: key, mutation: entries.some((e) => e.project === 'mutation'), label: `Playwright: ${key}${note}`, error: entries.find((e) => !e.ok)?.error };
    }
    const step = findStep(entries[0].steps, stepPrefix);
    if (!step) {
      if (optional) return null;
      throw new Error(`Playwright step not found: ${key} › ${stepPrefix}`);
    }
    return { ok: !step.error, mutation: entries.some((e) => e.project === 'mutation'), label: `Playwright step: ${key} › ${step.title}`, error: step.error?.message };
  }
  if (kind === 'unit') {
    const wildcard = rest.endsWith('*');
    const prefix = wildcard ? rest.slice(0, -1) : rest;
    const hits = [...unitRun.tests.entries()].filter(([k]) => (wildcard ? k.startsWith(prefix) : k === prefix));
    if (!hits.length) throw new Error(`Vitest test not found: ${rest}`);
    const failed = hits.find(([, a]) => a.status !== 'passed');
    // Every matched test by its full title (one per line), never a count.
    const label = hits.map(([k]) => `Unit: ${k}`).join('\n');
    return { ok: !failed, unit: true, count: hits.length, label, error: failed ? failed[1].failureMessages?.[0] : undefined };
  }
  throw new Error(`Unknown reference kind: ${ref}`);
}

/**
 * The "Automated test" cell: every test by its full title, one per line. When a row has more than 3, a first line
 * names all the screens / groups covered, so a narrow (wrapped) cell still shows that every screen is included.
 */
function testsCell(results, total) {
  const lines = results.flatMap((r) => r.label.split('\n'));
  if (total <= 3) return lines.join('\n');
  const groups = [...new Set(lines.map((l) => l.replace(/^[^:]+: /, '').split(/ › | > /)[1]).filter(Boolean))];
  return [`${total} tests, one per line below — ${groups.join(' · ')}`, ...lines].join('\n');
}

const H = [
  'Test Case ID', 'Platform', 'Role', 'Function / Module', 'Scenario', 'Type', 'Priority', 'Precondition', 'Steps', 'Input',
  'Expected Result', 'Automated test (full title)', 'Actual Result', 'Pass / Fail', 'Last Run Date',
  'Vercel run (readonly)', 'Runs on QA server', 'How QA reproduces',
];

const seen = new Set();
const rows = cases.map(([id, module, area, type, priority, role, pre, steps, input, expected, refs, qa, howQa]) => {
  if (seen.has(id)) throw new Error(`Duplicate id ${id}`);
  seen.add(id);
  if (!refs.length) throw new Error(`${id} names no test`);

  const results = refs.map((ref) => resolve(ref, ref.startsWith('unit:') ? unitRun : local));
  const ok = results.every((r) => r.ok);
  const total = results.reduce((n, r) => n + (r.count ?? 1), 0);
  const usedUnit = results.some((r) => r.unit);
  const usedPw = results.some((r) => !r.unit);
  const date = [usedPw && local.date, usedUnit && unitRun.date].filter(Boolean).sort().at(-1);
  const actual = ok
    ? `기대 결과대로 동작함 — 자동 테스트 ${total}건 모두 통과${results.some((r) => r.rerun) ? ` (1건은 전체 실행 중 실패(${reasonOf(results.find((r) => r.rerun).rerunKey).ko}) 후 단독 재실행에서 통과)` : ''}`
    : `실패: ${firstLine(results.find((r) => !r.ok).error)}`;

  // The same readonly tests, run against the Vercel deployment.
  let onVercel;
  if (!vercel) onVercel = 'not run';
  else if (results.some((r) => r.mutation)) onVercel = 'Local only (writes data)';
  else if (!usedPw) onVercel = 'n/a (unit test)';
  else {
    const v = refs.filter((r) => !r.startsWith('unit:')).map((r) => resolve(r, vercel, { optional: true }));
    onVercel = v.some((r) => r === null) ? 'not run' : v.every((r) => r.ok) ? 'Pass' : 'Fail';
  }

  return [
    id, 'Admin web (PC browser)', role, module, area, type, priority, pre, steps, input, expected,
    testsCell(results, total), actual, ok ? 'Pass' : 'Fail', date, onVercel, qa, howQa,
  ];
});

const csvCell = (v) => {
  const t = String(v ?? '');
  return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
const csv = [H, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
writeFileSync(here('./HW3-Pranesh-unit-test-cases.csv'), '﻿' + csv);

const count = (i, v) => rows.filter((r) => r[i] === v).length;
console.log(`${rows.length} cases: ${count(5, 'Positive')} positive / ${count(5, 'Negative')} negative`);
console.log(`Pass ${count(13, 'Pass')} · Fail ${count(13, 'Fail')} · last run ${local.date} (Playwright) / ${unitRun.date} (Vitest)`);
console.log(`Vercel: Pass ${count(15, 'Pass')} · Fail ${count(15, 'Fail')} · local only ${count(15, 'Local only (writes data)')} · unit ${count(15, 'n/a (unit test)')} · not run ${count(15, 'not run')}`);
console.log(`QA server: ${['Yes', 'Yes (DevTools)', 'Mock only', 'Do not run on the shared account'].map((k) => `${k} ${count(16, k)}`).join(' · ')}`);
