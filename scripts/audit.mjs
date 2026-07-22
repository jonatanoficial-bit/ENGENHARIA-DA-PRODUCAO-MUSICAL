import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(process.cwd());
const ignore = new Set(['node_modules', '.git', 'outputs', 'work']);
const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  if (ignore.has(entry.name)) return [];
  const full = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});
const files = walk(root);
const htmlFiles = files.filter((file) => file.endsWith('.html') && !file.includes(`${path.sep}components${path.sep}`));
const standalonePages = new Set(['aluno/certificado.html']);
const errors = [];
const required = ['index.html', '404.html', 'site.webmanifest', 'sw.js', 'components/header.html', 'components/footer.html', 'components/component-loader.js', 'css/tokens.css', 'css/base.css', 'css/components.css', 'css/layout.css', 'css/phase-2.css', 'css/phase-3.css', 'css/platform.css', 'css/final-polish.css', 'js/app.js', 'js/home.js', 'js/portal.js', 'js/smart-tools.js', 'firebase/firebase-auth.js', 'firebase/firebase-config.js', 'FIREBASE-SETUP.txt', 'assets/images/hero-studio-ai.png', 'assets/brand/emp-vale-signature.svg', 'assets/brand/emp-vale-mark.svg', 'assets/founder/jonatan-vale-founder.png', 'assets/founder/jonatan-vale-studio.png', 'assets/partners/instituto-musical-vale.jpg', 'assets/partners/vale-producao.png', 'docs/brand-guidelines.md', 'docs/FINAL-AUDIT.md', 'README.md', 'CHANGELOG.md'];

required.forEach((file) => { if (!fs.existsSync(path.join(root, file))) errors.push(`Arquivo obrigatório ausente: ${file}`); });
htmlFiles.forEach((file) => {
  const source = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file);
  if (!source.includes('viewport')) errors.push(`${relative}: meta viewport ausente`);
  if (!source.includes('<title>')) errors.push(`${relative}: title ausente`);
  if (!source.includes('name="description"') && !source.includes('name="robots"')) errors.push(`${relative}: meta description ausente`);
  if (!standalonePages.has(relative.replaceAll('\\', '/')) && !source.includes('data-component="header"')) errors.push(`${relative}: componente header ausente`);
  if (!standalonePages.has(relative.replaceAll('\\', '/')) && !source.includes('data-component="footer"')) errors.push(`${relative}: componente footer ausente`);
  const refs = [...source.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  refs.filter((reference) => !/^(https?:|mailto:|#)/.test(reference)).forEach((reference) => {
    const clean = reference.split(/[?#]/)[0];
    if (!clean || clean.endsWith('.html') === false && !/\.(css|js|svg|webmanifest)$/.test(clean)) return;
    if (!fs.existsSync(path.resolve(path.dirname(file), clean))) errors.push(`${relative}: referência inválida → ${reference}`);
  });
});

if (errors.length) {
  console.error(`Auditoria falhou com ${errors.length} problema(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`Auditoria aprovada: ${htmlFiles.length} páginas, ${required.length} arquivos essenciais e referências locais verificadas.`);
