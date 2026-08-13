const { getDb } = require('./_firebase-admin');

const cleanCode = (value) => String(value || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40);
const displayDate = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('pt-BR').format(date) : 'Data registrada no documento';
};

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  const code = cleanCode(req.query?.code);
  if (code.length < 8) return res.status(400).json({ valid: false });
  try {
    const snapshot = await getDb().collection('certificates').doc(code).get();
    if (!snapshot.exists) return res.status(404).json({ valid: false });
    const certificate = snapshot.data() || {};
    if (certificate.status === 'revoked' || certificate.active === false) return res.status(404).json({ valid: false });
    return res.status(200).json({
      valid: true,
      code,
      studentName: certificate.studentName || 'Titular registrado',
      courseName: certificate.courseName || 'Engenharia da Produção Musical™',
      courseHours: Number(certificate.courseHours) || 180,
      issuedAt: displayDate(certificate.issuedAt)
    });
  } catch (error) {
    console.error('Erro na verificação de certificado', error?.message || error);
    return res.status(503).json({ valid: false, error: 'Consulta temporariamente indisponível.' });
  }
};
