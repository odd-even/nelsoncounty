#!/usr/bin/env node
/**
 * Split monolithic index.html into cacheable admin assets.
 * Run from repo root: node scripts/split-admin-assets.mjs
 * Bump ADMIN_BUILD when admin.css / admin-auth.js / admin-data.js / admin.js change.
 */
import fs from 'fs';

const ADMIN_BUILD = '20260610a';
const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

function extract(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

const style1 = extract(23, 2394);
const style2 = extract(2485, 2643);
const authEarly = extract(2399, 2480);
const authMain = extract(2738, 3734);
const testScript = extract(4559, 4573);
const initialDataBlock = extract(4576, 4796);
const mainScriptRest = extract(4797, 15667);
const fallbackScript = extract(15671, 16113);

const adminCss = `${style1}\n\n/* Critical CSS for login page and initial UI */\n${style2}\n`;
const adminAuthJs = `${authEarly}\n\n${authMain}\n`;
const adminDataJs = `${initialDataBlock}\n`;
const adminJs = `${testScript}\n\n${mainScriptRest}\n\n${fallbackScript}\n`;

fs.writeFileSync('admin.css', adminCss);
fs.writeFileSync('admin-auth.js', adminAuthJs);
fs.writeFileSync('admin-data.js', adminDataJs);
fs.writeFileSync('admin.js', adminJs);

const headStart = extract(1, 21).replace(
  '<!-- Local Stylesheet for Admin Panel -->',
  '<!-- Admin assets (bump ?v= when changing admin.css / admin-*.js) -->'
);

const assetLinks = [
  `    <link rel="stylesheet" href="admin.css?v=${ADMIN_BUILD}">`,
  `    <link rel="preload" href="admin-data.js?v=${ADMIN_BUILD}" as="script">`,
  `    <link rel="preload" href="admin.js?v=${ADMIN_BUILD}" as="script">`,
  `    <link rel="preload" href="data/listings.json" as="fetch" crossorigin>`,
  `    <script src="admin-auth.js?v=${ADMIN_BUILD}" defer></script>`,
  `    <script src="admin-data.js?v=${ADMIN_BUILD}" defer></script>`,
].join('\n');

const bodyStart = extract(2647, 2734);
const bodyMain = extract(3737, 4557);
const bodyEnd = extract(16115, lines.length);

const newHtml = `${headStart}
${assetLinks}
</head>
${bodyStart}

${bodyMain}
    <script src="admin.js?v=${ADMIN_BUILD}" defer></script>
${bodyEnd}`;

fs.writeFileSync('index.html', newHtml);

console.log('ADMIN_BUILD', ADMIN_BUILD);
for (const f of ['admin.css', 'admin-auth.js', 'admin-data.js', 'admin.js', 'index.html']) {
  console.log(f, fs.statSync(f).size, 'bytes');
}
