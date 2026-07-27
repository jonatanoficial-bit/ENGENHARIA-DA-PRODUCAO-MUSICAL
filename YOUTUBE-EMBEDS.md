# Como publicar as gravações das aulas

As aulas podem ser gravadas no OBS e enviadas ao YouTube como **Não listado**. Isso mantém o vídeo fora de buscas e do canal público; porém, não substitui uma plataforma com DRM: qualquer pessoa que receba o link pode assisti-lo. Por isso, mantenha a Área do Aluno protegida pelo Firebase e não divulgue os links em materiais públicos.

## Para cada aula

1. Grave a aula ao vivo no OBS.
2. Envie o vídeo ao YouTube e defina a visibilidade como **Não listado**.
3. Copie somente o ID do vídeo. Em `https://www.youtube.com/watch?v=ABC123`, o ID é `ABC123`.
4. Crie ou edite o arquivo `js/youtube-embeds.js` com este formato:

```js
window.EPM_YOUTUBE_EMBEDS = {
  m01a01: 'ABC123',
  m01a02: 'DEF456'
};
```

5. Inclua antes de `course-catalog.js` em `aluno/index.html`:

```html
<script src="../js/youtube-embeds.js"></script>
```

Os códigos seguem este padrão: `m01a01` significa Módulo 01, Aula 01; `m07a12` significa Módulo 07, Aula 12.

## Calendário de turma

No elemento `data-course-catalog` de `aluno/index.html`, configure `data-course-start` com a data de início da turma em `AAAA-MM-DD`. O sistema libera duas aulas por semana. Se o campo ficar vazio, a interface usa a data atual apenas como prévia local.

Exemplo:

```html
<div class="course-catalog" data-course-catalog data-course-start="2026-08-10">
```
