# Engenharia da Produção Musical™

Fundação da plataforma estática, criada para publicação no GitHub Pages.

## Fases 01–11 — Fundação, Identidade, Operação e Auditoria Final

Inclui arquitetura de páginas, componentes compartilhados, identidade visual final, Home premium, plataforma institucional, área do aluno, assistente inteligente demonstrativo, áreas premium e comercial, painel administrativo demonstrativo, Firebase preparado para login Google, PWA, SEO técnico e auditoria final.

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
