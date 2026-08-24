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
const standalonePages = new Set();
const errors = [];
const required = ['index.html', '404.html', 'site.webmanifest', 'sw.js', 'BUILD.txt', 'components/header.html', 'components/footer.html', 'components/component-loader.js', 'css/tokens.css', 'css/base.css', 'css/components.css', 'css/layout.css', 'css/phase-2.css', 'css/phase-3.css', 'css/platform.css', 'css/final-polish.css', 'css/phase-12.css', 'js/app.js', 'js/home.js', 'js/portal.js', 'js/smart-tools.js', 'firebase/firebase-auth.js', 'firebase/auth-guard.js', 'firebase/firebase-config.js', 'FIREBASE-SETUP.txt', 'assets/images/hero-studio-ai.png', 'assets/brand/logo-oficial-emp.png', 'assets/brand/emp-vale-signature.svg', 'assets/brand/emp-vale-mark.svg', 'assets/campaign/formas-pagamento.png', 'assets/campaign/onda-dourada.png', 'assets/campaign/onda-tecnologia.png', 'assets/campaign/hero-estudio.png', 'assets/founder/jonatan-vale-founder.png', 'assets/founder/jonatan-vale-studio.png', 'assets/partners/instituto-musical-vale.jpg', 'assets/partners/vale-producao.png', 'docs/brand-guidelines.md', 'docs/FINAL-AUDIT.md', 'README.md', 'CHANGELOG.md'];

required.forEach((file) => { if (!fs.existsSync(path.join(root, file))) errors.push(`Arquivo obrigatório ausente: ${file}`); });
['css/phase-13.css', 'assets/campaign/home-vale-music-academy.png', 'assets/curriculum/daws.png', 'assets/curriculum/plugins-e-mixagem.png', 'assets/curriculum/instrumentos-virtuais.png', 'assets/curriculum/ia-criativa.png', 'assets/curriculum/streaming-e-distribuicao.png', 'assets/curriculum/audio-e-hardware.png', 'assets/curriculum/microfones-e-interfaces.png', 'assets/curriculum/video-e-design.png'].forEach((file) => { if (!fs.existsSync(path.join(root, file))) errors.push(`Arquivo obrigatório ausente: ${file}`); });
['css/phase-14.css', 'js/course-catalog.js', 'assets/team/giovane-firmino.jpg', 'YOUTUBE-EMBEDS.md', 'FIREBASE-CONTROLE-DE-CURSO.txt'].forEach((file) => { if (!fs.existsSync(path.join(root, file))) errors.push(`Arquivo obrigatório ausente: ${file}`); });
['css/phase-15.css', 'js/checkout-links.js', 'js/student-assessments.js', 'js/teacher-portal.js', 'firebase/firebase-client.js', 'firebase/teacher-guard.js', 'FIRESTORE-RULES-ACADEMIA.txt', 'OPERACAO-HOTMART-E-MATRICULAS.txt', 'GOOGLE-DRIVE-ENTREGAS.txt', 'professor/index.html'].forEach((file) => { if (!fs.existsSync(path.join(root, file))) errors.push(`Arquivo obrigatório ausente: ${file}`); });
['css/phase-16.css', 'aluno/perfil.html', 'js/student-profile.js', 'api/hotmart-webhook.js', 'api/claim-enrollment.js', 'api/_firebase-admin.js', '.env.example', 'JORNADA-HOTMART-E-ALUNO.txt'].forEach((file) => { if (!fs.existsSync(path.join(root, file))) errors.push(`Arquivo obrigatório ausente: ${file}`); });
['css/phase-20.css', 'css/phase-21.css', 'api/issue-certificate.js', 'api/verify-certificate.js', 'js/certificate-verifier.js', 'js/international.js', 'pages/privacidade.html', 'pages/termos.html', 'pages/cookies.html', 'pages/reembolso.html', 'pages/transparencia.html', 'pages/verificar-certificado.html', 'pages/international.html', 'BUILD-FASE-21.txt', 'GUIA-FASE-21-PRONTIDAO-COMERCIAL.txt'].forEach((file) => { if (!fs.existsSync(path.join(root, file))) errors.push(`Arquivo obrigatório ausente: ${file}`); });
['css/phase-22.css', 'js/academic-model.js', 'js/student-access-tracker.js', 'js/student-report-card.js', 'js/teacher-academic-dashboard.js', 'js/supporters.js', 'aluno/boletim.html', 'pages/apoiadores.html', 'api/manage-staff.js', 'BUILD-FASE-22.txt', 'GUIA-FASE-22-PAINEL-ACADEMICO.txt'].forEach((file) => { if (!fs.existsSync(path.join(root, file))) errors.push(`Arquivo obrigatório ausente: ${file}`); });
htmlFiles.forEach((file) => {
  const source = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file);
  if (!source.includes('viewport')) errors.push(`${relative}: meta viewport ausente`);
  if (!source.includes('<title>')) errors.push(`${relative}: title ausente`);
  if (!source.includes('name="description"') && !source.includes('name="robots"')) errors.push(`${relative}: meta description ausente`);
  if (!standalonePages.has(relative.replaceAll('\\', '/')) && !source.includes('data-component="header"')) errors.push(`${relative}: componente header ausente`);
  if (!standalonePages.has(relative.replaceAll('\\', '/')) && !source.includes('data-component="footer"')) errors.push(`${relative}: componente footer ausente`);
  if (source.includes('data-demo-form')) errors.push(`${relative}: formulário demonstrativo não permitido na versão comercial`);
  if (/estrutura editorial criada|ser[aã] desenvolvid[oa]|Fase\s+\d+/i.test(source)) errors.push(`${relative}: linguagem de protótipo encontrada`);
  const refs = [...source.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  refs.filter((reference) => !/^(https?:|mailto:|#)/.test(reference)).forEach((reference) => {
    const clean = reference.split(/[?#]/)[0];
    if (!clean || clean.endsWith('.html') === false && !/\.(css|js|svg|webmanifest)$/.test(clean)) return;
    if (!fs.existsSync(path.resolve(path.dirname(file), clean))) errors.push(`${relative}: referência inválida → ${reference}`);
  });
});

const protectedIntegrations = ['api/_firebase-admin.js', 'api/claim-enrollment.js', 'api/hotmart-webhook.js', 'firebase/firebase-client.js', 'firebase/firebase-auth.js', 'firebase/auth-guard.js', 'firebase/teacher-guard.js', 'firebase/firebase-config.js', 'js/checkout-links.js'];
protectedIntegrations.forEach((file) => { if (!fs.existsSync(path.join(root, file))) errors.push(`Integração protegida ausente: ${file}`); });

if (errors.length) {
  console.error(`Auditoria falhou com ${errors.length} problema(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`Auditoria aprovada: ${htmlFiles.length} páginas, ${required.length} arquivos essenciais e referências locais verificadas.`);
