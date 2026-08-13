const crypto = require('node:crypto');
const { getDb, getFirebaseAuth, serverTimestamp } = require('./_firebase-admin');

const bearer = (header = '') => String(header).startsWith('Bearer ') ? String(header).slice(7) : '';
const safeName = (value) => String(value || '').trim().replace(/\s+/g, ' ').slice(0, 120);
const makeCode = (uid) => `EMP-${crypto.createHash('sha256').update(`${uid}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`).digest('hex').slice(0, 16).toUpperCase()}-${new Date().getFullYear()}`;
const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    const decoded = await getFirebaseAuth().verifyIdToken(bearer(req.headers.authorization));
    const db = getDb();
    const [studentDoc, catalogDoc, certificationDoc, existing, assessmentDocs, projectDocs] = await Promise.all([
      db.collection('students').doc(decoded.uid).get(),
      db.collection('students').doc(decoded.uid).collection('progress').doc('catalog').get(),
      db.collection('academicSettings').doc('certification').get(),
      db.collection('certificates').where('studentId', '==', decoded.uid).limit(10).get(),
      db.collection('assessments').get(),
      db.collection('students').doc(decoded.uid).collection('projects').get()
    ]);
    if (!studentDoc.exists || studentDoc.data().enrollmentStatus !== 'paid') return res.status(403).json({ error: 'Matrícula ativa não localizada.' });
    if (!catalogDoc.exists) return res.status(403).json({ error: 'Progresso acadêmico insuficiente.' });

    const completed = Array.isArray(catalogDoc.data().completedLessons) ? catalogDoc.data().completedLessons.length : 0;
    const progress = Math.round((completed / 162) * 100);
    const submissionDocs = await Promise.all(assessmentDocs.docs.map((item) => item.ref.collection('submissions').doc(decoded.uid).get()));
    const testScores = submissionDocs.filter((item) => item.exists && Number.isFinite(Number(item.data().score))).map((item) => Number(item.data().score));
    const projectScores = projectDocs.docs.filter((item) => Number.isFinite(Number(item.data().score))).map((item) => Number(item.data().score));
    const components = [average(testScores), average(projectScores), completed ? progress : null].filter((value) => value !== null);
    const finalScore = components.length ? Math.round(average(components)) : null;
    if (progress < 90 || finalScore === null || finalScore < 70) return res.status(403).json({ error: 'Requisitos acadêmicos ainda não cumpridos.' });

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
