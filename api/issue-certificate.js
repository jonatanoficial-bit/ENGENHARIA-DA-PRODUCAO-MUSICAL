const crypto = require('node:crypto');
const { getDb, getFirebaseAuth, serverTimestamp } = require('./_firebase-admin');

const bearer = (header = '') => String(header).startsWith('Bearer ') ? String(header).slice(7) : '';
const safeName = (value) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, 120);
const makeCode = (uid) => `EMP-${crypto.createHash('sha256').update(`${uid}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`).digest('hex').slice(0, 16).toUpperCase()}-${new Date().getFullYear()}`;
const lessonCounts = [4,8,8,8,10,10,12,8,8,8,10,8,12,8,8,8,8,6,6,4];
const validLessons = new Set(lessonCounts.flatMap((count,index) => Array.from({length:count}, (_,n) => 'm'+String(index+1).padStart(2,'0')+'a'+String(n+1).padStart(2,'0'))));
const gradeValue = (value) => {
  if (value === null || value === undefined || typeof value === 'boolean' || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 100 ? number : null;
};
const publishedScore = (item) => item?.status === 'graded' ? gradeValue(item.score) : null;
const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const weightedScore = ({ assessments, activities, continuous, finalProject }) => {
  const parts = [
    { value:average(assessments), weight:55 },
    { value:average(activities), weight:10 },
    { value:gradeValue(continuous), weight:15 },
    { value:gradeValue(finalProject), weight:20 }
  ];
  if (parts.some((item) => item.value === null)) return null;
  return Math.round(parts.reduce((sum, item) => sum + item.value * item.weight, 0) / 100);
};

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    const decoded = await getFirebaseAuth().verifyIdToken(bearer(req.headers.authorization));
    const db = getDb();
    const [studentDoc, catalogDoc, certificationDoc, existing, assessmentDocs, projectDocs, activityDocs] = await Promise.all([
      db.collection('students').doc(decoded.uid).get(),
      db.collection('students').doc(decoded.uid).collection('progress').doc('catalog').get(),
      db.collection('academicSettings').doc('certification').get(),
      db.collection('certificates').where('studentId', '==', decoded.uid).limit(10).get(),
      db.collection('assessments').get(),
      db.collection('students').doc(decoded.uid).collection('projects').get(),
      db.collection('students').doc(decoded.uid).collection('activities').get()
    ]);
    if (!studentDoc.exists || studentDoc.data().enrollmentStatus !== 'paid') return res.status(403).json({ error: 'Matrícula ativa não localizada.' });
    if (!catalogDoc.exists) return res.status(403).json({ error: 'Progresso acadêmico insuficiente.' });

    const activities = activityDocs.docs.map((item) => ({id:item.id, ...item.data()}));
    const activityKeys = new Set(activities.filter((item) => typeof item.answer === 'string' && item.answer.trim().length >= 12).map((item) => item.lessonKey || item.id));
    const keys = Array.isArray(catalogDoc.data().completedLessons) ? catalogDoc.data().completedLessons : [];
    const completed = [...new Set(keys)].filter((key) => validLessons.has(key) && activityKeys.has(key)).length;
    const progress = Math.round((completed / 162) * 100);
    const submissionDocs = await Promise.all(assessmentDocs.docs.map((item) => item.ref.collection('submissions').doc(decoded.uid).get()));
    const testScores = submissionDocs.filter((item) => item.exists).map((item) => publishedScore(item.data())).filter((value) => value !== null);
    const projects = projectDocs.docs.map((item) => ({ id:item.id, ...item.data() }));
    const continuous = projects.find((item) => item.kind === 'continuous' || item.id === 'continuous');
    const finalProject = projects.find((item) => item.kind === 'final' || item.id === 'final');
    const activityScores = activities.map(publishedScore).filter((value) => value !== null);
    const finalScore = weightedScore({ assessments:testScores, activities:activityScores, continuous:publishedScore(continuous), finalProject:publishedScore(finalProject) });
    if (completed / 162 < 0.9 || finalScore === null || finalScore < 70) return res.status(403).json({ error: 'Requisitos acadêmicos ainda não cumpridos.' });

    const studentName = safeName(req.body?.studentName || studentDoc.data().name || decoded.name || studentDoc.data().email);
    const courseHours = certificationDoc.exists && Number(certificationDoc.data().courseHours) > 0 ? Number(certificationDoc.data().courseHours) : 180;
    const activeCertificate = existing.docs.find((item) => item.data().active === true && item.data().status === 'valid');
    if (activeCertificate) {
      return res.status(200).json({ code: activeCertificate.id, studentName: activeCertificate.data().studentName || studentName, courseHours, finalScore, existing: true });
    }

    const code = makeCode(decoded.uid);
    await db.collection('certificates').doc(code).set({
      code, studentId: decoded.uid, studentName, courseName: 'Engenharia da Produção Musical™', courseHours,
      progress, finalScore, active: true, status: 'valid', issuedAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
    return res.status(201).json({ code, studentName, courseHours, finalScore, existing: false });
  } catch (error) {
    console.error('Erro ao emitir certificado', error?.message || error);
    return res.status(401).json({ error: 'Não foi possível validar a emissão.' });
  }
};
