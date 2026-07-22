# Auditoria de Entrega — EMP v1.1.0 · Fase 13

## Escopo verificado

- Estrutura de páginas, componentes, CSS, JavaScript e assets locais.
- Links internos, metadados obrigatórios e arquivos essenciais para publicação estática.
- Landing page comercial com proposta institucional, metodologia, programa didático, apresentação do fundador, condições de matrícula, FAQ e CTAs.
- Aplicação dos assets de lançamento enviados: logo oficial, cenários, imagem de pagamento e identidade visual.
- Proteção das rotas da Área do Aluno por Firebase Authentication: sem configuração válida ou sessão Google ativa, o acesso é redirecionado para o login.
- Rolagem vertical da Home revisada para mouse, trackpad e toque; a página mantém apenas a contenção horizontal.
- Grade Curricular ampliada com referências visuais de softwares, plugins, instrumentos, IA, streaming, distribuição, hardware e criação audiovisual.
- Identidade institucional: Instituto Musical Vale · CNPJ 31.255.200/0001-19; programa desenvolvido pela Vale Produções em parceria com o Instituto Musical Vale.

## Verificações de integridade

- `npm run audit` confere os arquivos essenciais, páginas, metadados e referências locais.
- `scripts/package.ps1` gera o ZIP de entrega sem incluir as pastas de trabalho ou pacotes anteriores.
- `BUILD.txt` registra a versão, a fase e a data/hora da geração.

## Dependências de publicação

- Preencher `firebase/firebase-config.js`, habilitar Google no Firebase Authentication e autorizar o domínio de publicação conforme `FIREBASE-SETUP.txt`.
- Conectar um provedor de pagamento antes de disponibilizar cobrança, parcelamento ou boleto real.
- Configurar, no backend, a liberação de acesso após confirmação de matrícula e a emissão de certificados oficiais com identificador único e validação.

## Enquadramento institucional

- Formação classificada como Curso Livre de Formação Profissional.
- Certificado de conclusão emitido pelo Instituto Musical Vale conforme a legislação aplicável aos cursos livres.
- A plataforma não apresenta a formação como graduação, tecnólogo, pós-graduação ou curso reconhecido pelo MEC.
