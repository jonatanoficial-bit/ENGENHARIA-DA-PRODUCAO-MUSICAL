import { firebaseReady } from '../firebase/firebase-client.js';
import { buildModuleReport, calculateAcademicGrade, formatGrade, TOTAL_LESSONS, publishedScore } from './academic-model.js';

const safe = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
const authorized = window.empStudentSession ? Promise.resolve(window.empStudentSession) : new Promise((resolve) => document.addEventListener('student:authorized', (event) => resolve(event.detail), { once:true }));
const progressNode = document.querySelector('[data-report-progress]');
const summaryNode = document.querySelector('[data-report-summary]');
const weightsNode = document.querySelector('[data-grade-weights]');
const modulesNode = document.querySelector('[data-module-report]');

if (firebaseReady && summaryNode) {
  try {
    const { user, preview } = await authorized;
    const { db, firestoreSdk } = await firebaseReady;
    const { collection, doc, getDoc, getDocs, query, where } = firestoreSdk;
    const [progressDoc, activitiesSnap, projectsSnap, assessmentsSnap] = await Promise.all([
      getDoc(doc(db,'students',user.uid,'progress','catalog')),
      getDocs(collection(db,'students',user.uid,'activities')),
      getDocs(collection(db,'students',user.uid,'projects')),
      getDocs(query(collection(db,'assessments'),where('published','==',true)))
    ]);
    const progress = progressDoc.exists() ? progressDoc.data() : {};
    const completedLessons = Array.isArray(progress.completedLessons) ? progress.completedLessons : [];
    const activities = activitiesSnap.docs.map((entry) => ({ id:entry.id, ...entry.data() }));
    const projects = projectsSnap.docs.map((entry) => ({ id:entry.id, ...entry.data() }));
    const assessments = await Promise.all(assessmentsSnap.docs.map(async (entry) => {
      const submission = await getDoc(doc(db,'assessments',entry.id,'submissions',user.uid));
      return { id:entry.id, ...entry.data(), ...(submission.exists() ? submission.data() : {}) };
    }));
    const assessmentScores = assessments.map(publishedScore).filter((value) => value !== null);
    const activityScores = activities.map(publishedScore).filter((item) => item !== null);
    const continuous = projects.find((item) => item.kind === 'continuous' || item.id === 'continuous');
    const finalProject = projects.find((item) => item.kind === 'final' || item.id === 'final');
    const grade = calculateAcademicGrade({ assessmentScores, activityScores, continuousScore:publishedScore(continuous), finalScore:publishedScore(finalProject) });
    const coursePercent = Math.round((completedLessons.length / Number(progress.totalLessons || TOTAL_LESSONS)) * 100);
    progressNode.innerHTML = `<strong>${coursePercent}%</strong><span>do curso concluído</span>`;
    summaryNode.innerHTML = `${preview ? '<p class="course-alert"><strong>Visualização docente:</strong> este boletim não cria registros.</p>' : ''}<div class="report-summary-grid"><article><span>Média parcial ponderada</span><strong>${formatGrade(grade.partial)}</strong><small>${grade.availableWeight}% dos componentes já possuem nota</small></article><article><span>Provas corrigidas</span><strong>${assessmentScores.length}</strong><small>média ${formatGrade(grade.parts[0].value)}</small></article><article><span>Atividades entregues</span><strong>${activities.length}</strong><small>${completedLessons.length} aula(s) marcada(s) como assistida(s)</small></article><article><span>Situação atual</span><strong>${grade.partial === null ? 'Em início' : grade.partial >= 70 ? 'Na média' : 'Atenção'}</strong><small>Conclusão exige 90% e nota mínima 70</small></article></div>`;
    weightsNode.innerHTML = grade.parts.map((item) => `<article><span>${safe(item.label)}</span><strong>${item.weight}%</strong><small>Nota: ${formatGrade(item.value)}</small></article>`).join('');
    const moduleReport = buildModuleReport({ completedLessons, activities, assessments });
    modulesNode.innerHTML = moduleReport.map((module) => `<tr><td data-label="Módulo"><strong>${module.id}</strong><small>${safe(module.title)}</small></td><td data-label="Aulas">${module.watched}/${module.lessons}<small>${module.percent}% concluído</small></td><td data-label="Atividades">${formatGrade(module.activityAverage)}</td><td data-label="Provas">${formatGrade(module.assessmentAverage)}</td><td data-label="Média">${formatGrade(module.average)}</td><td data-label="Situação"><span class="teacher-status ${module.percent === 100 ? 'teacher-status--ok' : ''}">${module.percent === 100 ? 'Concluído' : module.watched ? 'Em andamento' : 'Não iniciado'}</span></td></tr>`).join('');
  } catch (error) {
    summaryNode.innerHTML = `<p class="form-feedback form-feedback--error">Não foi possível carregar o boletim. Código: ${safe(error?.code || 'indisponível')}.</p>`;
  }
}
