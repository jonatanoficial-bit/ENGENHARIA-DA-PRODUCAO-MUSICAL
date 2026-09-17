export const TOTAL_LESSONS = 162;
export const MODULES = [
  ['M01','Boas-vindas e orientação profissional',4],['M02','Fundamentos do som e do áudio',8],
  ['M03','Fundamentos musicais para produtores',8],['M04','Estúdio, equipamentos e conexões',8],
  ['M05','Microfones e técnicas de captação',10],['M06','Acústica, PA e sistemas ao vivo',10],
  ['M07','Pro Tools: produção, edição e mixagem',12],['M08','Reaper e visão multi-DAW',8],
  ['M09','MIDI, plugins e instrumentos virtuais',8],['M10','Pré-produção, arranjo e direção artística',8],
  ['M11','Gravação em estúdio',10],['M12','Edição de áudio',8],['M13','Mixagem profissional',12],
  ['M14','Masterização',8],['M15','Produção vocal',8],['M16','Inteligência artificial aplicada à música',8],
  ['M17','Distribuição, direitos e mercado',8],['M18','Vídeo, design e identidade artística',6],
  ['M19','Projetos práticos e portfólio',6],['M20','Avaliação final e certificação',4]
].map(([id,title,lessons]) => ({ id, title, lessons }));

export const GRADE_WEIGHTS = Object.freeze({ assessments:55, activities:10, continuous:15, final:20 });

export function verifiedLessonCount(keys = [], activities = []) {
  const valid = new Set(MODULES.flatMap(module => Array.from({length:module.lessons}, (_,n) => `${module.id.toLowerCase()}a${String(n+1).padStart(2,'0')}`)));
  const submitted = new Set(activities.filter(item => typeof item.answer === 'string' && item.answer.trim().length >= 12).map(item => item.lessonKey || item.id));
  return [...new Set(Array.isArray(keys) ? keys : [])].filter(key => valid.has(key) && submitted.has(key)).length;
}

export const average = (values = []) => {
  const valid = values.map(gradeValue).filter((value) => value !== null);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
};

export const gradeValue = (value) => {
  if (value === null || value === undefined || typeof value === 'boolean' || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 100 ? number : null;
};
export const publishedScore = (item) => item?.status === 'graded' ? gradeValue(item.score) : null;

export function calculateAcademicGrade({ assessmentScores = [], activityScores = [], continuousScore = null, finalScore = null } = {}) {
  const parts = [
    { key:'assessments', label:'Avaliações dos módulos', value:average(assessmentScores), weight:GRADE_WEIGHTS.assessments },
    { key:'activities', label:'Atividades após as aulas', value:average(activityScores), weight:GRADE_WEIGHTS.activities },
    { key:'continuous', label:'Projeto 1 — produção contínua', value:gradeValue(continuousScore), weight:GRADE_WEIGHTS.continuous },
    { key:'final', label:'Projeto 2 — TCC final', value:gradeValue(finalScore), weight:GRADE_WEIGHTS.final }
  ];
  const graded = parts.filter((item) => item.value !== null);
  const availableWeight = graded.reduce((sum, item) => sum + item.weight, 0);
  const partial = availableWeight ? graded.reduce((sum, item) => sum + item.value * item.weight, 0) / availableWeight : null;
  const official = graded.length === parts.length ? parts.reduce((sum, item) => sum + item.value * item.weight, 0) / 100 : null;
  return { parts, partial, official, availableWeight };
}

export const moduleFromLessonKey = (key = '') => {
  const match = String(key).toUpperCase().match(/^(M(?:0[1-9]|1\d|20))A\d{2}$/);
  return match ? match[1] : '';
};

export const lessonNumberFromKey = (key = '') => Number(String(key).match(/a(\d{2})$/i)?.[1] || 0);

export function buildModuleReport({ completedLessons = [], activities = [], assessments = [] } = {}) {
  const completed = new Set(completedLessons.map((item) => String(item).toLowerCase()));
  return MODULES.map((module) => {
    const moduleActivities = activities.filter((item) => String(item.moduleId || moduleFromLessonKey(item.lessonKey)).toUpperCase() === module.id);
    // Uma entrega sem correção não pode elevar artificialmente a média do aluno.
    const activityScores = moduleActivities.map(publishedScore).filter((item) => item !== null);
    const moduleAssessments = assessments.filter((item) => String(item.module || '').toUpperCase() === module.id && publishedScore(item) !== null);
    const assessmentAverage = average(moduleAssessments.map((item) => item.score));
    const activityAverage = average(activityScores);
    const available = [{ value:assessmentAverage, weight:85 }, { value:activityAverage, weight:15 }].filter((item) => item.value !== null);
    const moduleAverage = available.length ? available.reduce((sum, item) => sum + item.value * item.weight, 0) / available.reduce((sum, item) => sum + item.weight, 0) : null;
    const watched = Array.from(completed).filter((key) => moduleFromLessonKey(key) === module.id).length;
    return { ...module, watched, percent:Math.round((watched / module.lessons) * 100), activityAverage, assessmentAverage, average:moduleAverage };
  });
}

export const formatGrade = (value) => value === null || !Number.isFinite(Number(value)) ? 'N/A' : `${Math.round(Number(value) * 10) / 10}`;
