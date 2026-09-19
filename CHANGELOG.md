# Changelog

## [1.10.0] — 2026-09-19 — Fase 23

- Home acadêmica redesenhada com saudação, dados reais de plano e progresso, próximo passo e retomada da próxima aula disponível.
- Jornada dos 20 módulos com artes existentes, estados acadêmicos, progresso por módulo e navegação horizontal responsiva.
- Aula com player 16:9 protagonista, breadcrumb, modo foco, navegação anterior/próxima, atividade prática e transição após conclusão.
- Navegação acadêmica unificada para desktop e mobile, ícones SVG próprios, botões hierarquizados, avatar Google com alternativa por iniciais e onboarding local por aluno.
- Estados de carregamento, vazio e recuperação de erro revisados sem expor mensagens internas do Firebase.
- Área acadêmica, home pública e planos normalizados pela camada `phase-23-premium-learning.css`, sem alterar contratos Firestore, Firebase Auth, checkouts ou webhook Hotmart.
- Rotina automatizada de regressão visual em 1440, 768, 390 e 360 px, além das auditorias e testes de integração existentes.

## [1.9.1] — 2026-09-17

- Domínio canônico producaomusical.org, metadados e links de verificação de certificados.
- Correção da resolução dos módulos Firebase na página inicial e atualização do cache PWA.
- Matrículas e notificações Hotmart processadas em transações, preservando dados do aluno e impedindo reativação por notificações antigas de compras estornadas.
- Notas pendentes não são tratadas como zero ou aprovação; certificado verifica aulas únicas com atividade e notas publicadas.
- Progresso isolado por conta, com confirmação somente após persistência no Firestore; visualização docente sem gravar progresso.
- Regras de envio impedem que alunos atribuam notas e mantêm os formulários existentes.
- Configuração administrativa do portal de apoiadores respeitada, mantendo o endereço oficial como alternativa.
- 16 testes automatizados isolados para ofertas, matrícula, estorno, repetição de eventos, notas e certificados (npm test).


## [1.9.0] — 2026-08-24 — Fase 22

- Prontuário acadêmico individual no painel docente com posição atual, vídeos concluídos, comentários pós-aula, acessos e médias.
- Boletim estudantil com avanço nos 20 módulos e média ponderada entre provas, atividades, Projeto 1 e Projeto 2/TCC.
- Importação de avaliações em JSON gerado pelo ChatGPT e correção objetiva das tentativas em lote.
- Cadastro de professores pelo administrador, após o primeiro login Google, sem edição manual de documentos no Firestore.
- Página de apoiadores conectável a um portal externo pela área administrativa.
- Regras acadêmicas ampliadas sem alterar as rotas protegidas de Firebase Authentication, Hotmart e matrícula.
- Interface responsiva e contraste dos temas claro/escuro revisados para os novos painéis.

## [1.8.0] — 2026-08-13 — Fase 21

- Home e planos alinhados aos três produtos oficiais, com checkout Hotmart e condições explicadas sem promessas imprecisas.
- Páginas de privacidade, termos, cookies, cancelamento, transparência, contato e verificação pública de certificados adicionadas.
- Depoimentos fictícios e formulários demonstrativos removidos da experiência pública.
- Equipe acadêmica, canais oficiais e página internacional informativa em inglês e espanhol aprimorados.
- Emissão segura de certificado vinculada a matrícula ativa, 90% de conclusão e média final mínima de 70/100.
- Sitemap, robots, metadados sociais, foco de teclado, contraste do tema claro e experiência móvel revisados.
- Imagens mais acessadas convertidas para WebP, reduzindo significativamente o peso de carregamento sem remover os originais.
- Integrações centrais Firebase e Hotmart preservadas.

## [1.4.0] — 2026-07-28 — Fase 16

- Placar circular de progresso e página de perfil do aluno adicionados à plataforma.
- Painel docente ampliado com alunos ativos, receita bruta aprovada e comissão registrada por webhook.
- Rota Vercel segura para webhook da Hotmart e vínculo da compra ao login Google preparada com Firebase Admin.
- Guia didático completo da jornada comercial, das aulas e da publicação criado em `JORNADA-HOTMART-E-ALUNO.txt`.

## [1.3.1] — 2026-07-27 — Checkouts Hotmart

- Botões dos planos Essencial, Profissional e Premium conectados às respectivas ofertas oficiais da Hotmart.
- Pasta geral de trabalhos do Google Drive disponibilizada na Área do Aluno para a primeira turma.

## [1.3.0] — 2026-07-27 — Fase 15

### Operação acadêmica, avaliações e matrículas

- Nova Área do Professor com perfil docente validado no Firebase, lista de matrículas, avaliações, notas, chamadas de presença, solicitações de mentoria e vínculo de pastas do Google Drive.
- Provas integradas ao site: o professor publica questões, o aluno envia a resposta no painel e a correção é registrada pelo professor sem expor o gabarito ao aluno.
- Área do aluno ampliada com avaliações oficiais, solicitação de mentoria e acesso individual à pasta de entregas.
- Estrutura comercial preparada para checkout externo da Hotmart, com documentação para ofertas, Webhook e matrícula segura após pagamento aprovado.
- Documentação de regras Firestore, operação Hotmart e entregas individuais no Google Drive adicionada.

## [1.2.0] — 2026-07-27 — Fase 14

### Direção Acadêmica, Planos e Jornada Modular

- Inclusão do parceiro oficial Giovane Firmino da Silva, com perfil profissional, fotografia e credenciais técnicas ao lado do fundador Jonatan Vale.
- Página de planos reconstruída com os níveis Essencial (R$ 450,00), Profissional (R$ 797,00) e Premium (R$ 1.497,00), diferenciais claros e condições de pagamento explicitadas.
- Área do aluno convertida para trilha de 20 módulos e 162 aulas detalhadas, com agenda de duas aulas por semana, estados bloqueados e player pronto para embeds de gravações não listadas.
- Avaliação por módulo adicionada com nota mínima e progressão registrada localmente como interface de prévia; documentação criada para persistência segura com Firebase/Firestore.
- Adicionados os guias YOUTUBE-EMBEDS.md e FIREBASE-CONTROLE-DE-CURSO.txt.

## [1.1.0] — 2026-07-22 — Fase 13

### Experiência de navegação e ecossistema de ferramentas

- Correção da rolagem vertical na Home para mouse, trackpad e toque, preservando o bloqueio de excesso horizontal.
- Grade curricular renovada com vitrine visual de DAWs, plugins, instrumentos virtuais, IA, streaming, distribuição, áudio, interfaces, captação, vídeo e design.
- Inclusão de uma composição visual parcial na Home e novos materiais de referência educacional fornecidos para a formação.
- Aviso de propriedade de marcas adicionado à Grade Curricular e cache PWA atualizado para a nova versão.

## [1.0.0] — 2026-07-22 — Fase 12

### Lançamento comercial e acesso protegido

- Home reconstruída como página comercial completa, com proposta de valor, metodologia, módulos, mercado de trabalho, fundador, perguntas frequentes e CTAs de matrícula.
- Nova identidade aplicada com os materiais oficiais enviados, incluindo logo, cenários de estúdio e arte de formas de pagamento.
- Oferta consolidada em R$ 450,00, com cartão em até 12x, PIX e boleto à vista, além de 5% de desconto no cartão à vista (R$ 427,50).
- Área do aluno protegida por guarda de autenticação: sem configuração Firebase ou sessão Google válida, o acesso é direcionado ao login.
- Build datado e hora registrados em BUILD.txt; comunicado institucional e certificação revisados como Curso Livre de Formação Profissional.

## [0.11.0] — 2026-07-22 — Fases 08 a 11

### Fase 08 — Inteligência Aplicada

- Laboratório Inteligente na Área do Aluno, com assistente local de orientação, busca por objetivo, conquistas e estrutura de ranking.

### Fase 09 — Assets e Identidade Final

- Assinatura vetorial original da Engenharia da Produção Musical™ / Instituto Musical Vale.
- Inclusão dos retratos fornecidos do fundador e professor Jonatan Vale, além dos logos do Instituto Musical Vale e da Vale Produção.
- Página institucional do fundador e créditos institucionais atualizados.

### Fase 10 — Otimização

- Ajustes de responsividade, impressão de certificado, carregamento de assets locais, metadados e estilos de acabamento.
- Estrutura Firebase modular via browser modules preparada para autenticação Google.

### Fase 11 — Auditoria Final

- Auditoria ampliada de arquivos essenciais, páginas, SEO e referências locais.
- Documento de auditoria final e guia prático FIREBASE-SETUP.txt.
- Certificado demonstrativo emitido sob Instituto Musical Vale · CNPJ 31.255.200/0001-19.

## [0.7.0] — 2026-07-22 — Fases 04 a 07

### Fase 04 — Área do Aluno

- Login demonstrativo, dashboard, progresso persistente localmente, biblioteca, downloads, avaliações e certificação preparados.
- Player visual preparado para incorporar aulas do YouTube não listado sem expor links diretos.

### Fase 05 — Área Premium

- Mentorias com agenda ilustrativa, solicitação, histórico, área VIP e mensagens demonstrativas.
- Consultorias com formulário de diagnóstico e fluxo de atendimento preparado.

### Fase 06 — Plataforma Comercial

- Painel de afiliados com link, QR Code, indicadores, ranking e histórico ilustrativo.
- Cadastros de artista e consultor, além de solicitação de produção musical e orçamento.

### Fase 07 — Painel Administrativo

- Painel administrativo demonstrativo para usuários, formação, financeiro, blog, eventos, downloads, relatórios e configurações.
- Interações de abas e formulários locais, preparadas para posterior integração segura de backend.

### Comercial

- Oferta apresentada como R$ 450,00, com acesso vitalício e certificado de conclusão.
- Pagamento à vista no cartão com 5% de desconto (R$ 427,50), além de referências visuais a cartão em até 12x, boleto parcelado e Pix parcelado, condicionadas ao provedor de pagamento.

## [0.3.0] — 2026-07-22 — Fases 02 e 03

### Fase 02 — Identidade Visual + Home Premium

- Identidade visual documentada, com paleta, tipografia, uso de marca e princípios de movimento.
- Monograma original em SVG e imagem hero original criada por IA e salva localmente.
- Nova Home cinematográfica, com hero, indicadores, estatísticas, ciclos, benefícios, FAQ e microanimações acessíveis.
- Componentes de marca e rodapé atualizados para a versão v0.3.0.

### Fase 03 — Plataforma Institucional

- Páginas completas de Quem Somos, Metodologia, Grade Curricular, Direção Acadêmica e Planos.
- Apresentação dos seis ciclos da formação e das frentes de conhecimento.
- Layout de checkout visual, deliberadamente sem cobrança ou promessa de transação ativa.
- Dados estruturados e metadados aprimorados nas páginas institucionais.

## [0.1.0] — 2026-07-22 — Fase 01

### Adicionado

- Arquitetura inicial preparada para GitHub Pages e expansão futura.
- Sistema de componentes compartilhados para cabeçalho e rodapé.
- Navegação responsiva e seletor de tema persistente.
- Páginas-base para todas as áreas previstas na plataforma.
- Metadados de SEO, Open Graph e Schema.org.
- Manifest, service worker e ícones vetoriais para PWA.
- Auditoria local de links, arquivos essenciais e metadados.
- Identificação de versão discreta em todas as páginas.
