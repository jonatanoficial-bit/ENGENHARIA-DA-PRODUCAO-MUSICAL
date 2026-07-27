# Engenharia da Produção Musical™

Fundação da plataforma estática, criada para publicação no GitHub Pages.

## Fases 01–15 — Fundação, Identidade, Operação e Lançamento Comercial

Inclui arquitetura de páginas, componentes compartilhados, identidade visual final, landing page comercial, plataforma institucional, área do aluno, assistente inteligente, áreas premium e comercial, painel administrativo, Firebase preparado para login Google, PWA, SEO técnico e auditoria final.

### Fase 14 — direção acadêmica, planos e jornada modular

- Direção acadêmica apresentada com Jonatan Vale e Giovane Firmino da Silva, incluindo formação e atribuições no programa.
- Planos Essencial, Profissional e Premium com comparação de benefícios, valores e condições de pagamento dependentes do checkout.
- Catálogo completo do plano de aulas: 20 módulos e 162 aulas detalhadas, liberação em ritmo de duas aulas por semana, bloqueio visual e avaliação de avanço.
- `YOUTUBE-EMBEDS.md` orienta a publicação das gravações do OBS em vídeos não listados; `FIREBASE-CONTROLE-DE-CURSO.txt` explica como tornar matrícula, plano e progresso seguros no Firestore.

### Fase 15 — operação acadêmica e matrículas

- Área do Professor em `professor/index.html`, protegida por perfil docente no Firestore.
- Avaliações, notas, presenças, solicitações de mentoria e vínculos individuais de entrega no Google Drive.
- Checkout externo da Hotmart conectado às ofertas Essencial, Profissional e Premium. A primeira turma utiliza uma pasta geral de entregas no Google Drive; veja `OPERACAO-HOTMART-E-MATRICULAS.txt`, `FIRESTORE-RULES-ACADEMIA.txt` e `GOOGLE-DRIVE-ENTREGAS.txt`.

### Fase 13 — navegação e ecossistema de ferramentas

- Rolagem corrigida para mouse, trackpad e toque em desktop e dispositivos móveis.
- Grade curricular com vitrine visual de DAWs, plugins, instrumentos virtuais, IA, streaming, distribuição, áudio, hardware, vídeo e design.
- Novos assets de marca e referências educacionais aplicados com aviso de propriedade das marcas.

### Fase 12 — lançamento comercial

- Home longa de conversão, com oferta, metodologia, plano didático, área de atuação, apresentação do fundador, FAQ e CTA de matrícula.
- Integração dos materiais visuais oficiais de marca, estúdio e pagamento fornecidos para o lançamento.
- Proteção da área do aluno: antes de o Firebase ser configurado, as rotas de aluno redirecionam para o login; depois, exigem sessão Google válida.
- `BUILD.txt` registra a versão, a fase e a data/hora do pacote.

### Como visualizar

Abra `index.html` no navegador ou publique a pasta na raiz de um repositório GitHub Pages. Para uma prévia local com servidor:

```bash
npm run serve
```

### Auditoria

```bash
npm run audit
```

A auditoria verifica a existência das páginas essenciais, componentes, manifest, service worker, metadados, links internos e referências locais.

### Estrutura

- `components/`: cabeçalho, rodapé e carregador reutilizável.
- `css/`: tokens, base, componentes e layout.
- `js/`: comportamento global e tema.
- `pages/`, `aluno/`, `admin/`, `blog/`, `mentorias/`, `consultorias/`, `afiliados/`: áreas implementadas e preparadas para backend.
- `scripts/`: verificações de integridade.
- `firebase/` e `FIREBASE-SETUP.txt`: estrutura e guia para ativar login Google com Firebase gratuito.

## Publicação no GitHub Pages

1. Envie todos os arquivos para o repositório.
2. Em **Settings → Pages**, selecione a branch e a pasta raiz (`/`).
3. O PWA passa a funcionar em HTTPS após a publicação.

## Nota institucional

Curso Livre de Formação Profissional, ofertado conforme a legislação brasileira aplicável aos cursos livres, com emissão de certificado de conclusão.
