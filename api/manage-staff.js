const { getDb, getFirebaseAuth, serverTimestamp } = require('./_firebase-admin');

const bearer = (header = '') => String(header).startsWith('Bearer ') ? String(header).slice(7) : '';
const text = (value, max = 160) => String(value || '').trim().slice(0, max);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if (req.method !== 'POST') return res.status(405).json({ error:'Método não permitido.' });
  try {
    const decoded = await getFirebaseAuth().verifyIdToken(bearer(req.headers.authorization));
    const db = getDb();
    const caller = await db.collection('staff').doc(decoded.uid).get();
    const callerData = caller.exists ? caller.data() : {};
    if (callerData.active !== true || !['admin','owner'].includes(String(callerData.role || '').toLowerCase())) {
      return res.status(403).json({ error:'Somente um administrador ativo pode realizar esta operação.' });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (body.action === 'upsertProfessor') {
      const email = text(body.email, 190).toLowerCase();
      if (!email || !email.includes('@')) return res.status(400).json({ error:'Informe um e-mail Google válido.' });
      let target;
      try { target = await getFirebaseAuth().getUserByEmail(email); }
      catch { return res.status(404).json({ error:'Essa conta ainda não entrou no site com Google. Peça um primeiro login e tente novamente.' }); }
      if (target.uid === decoded.uid && body.active === false) return res.status(400).json({ error:'Você não pode desativar o próprio acesso.' });
      const role = ['teacher','admin'].includes(body.role) ? body.role : 'teacher';
      await db.collection('staff').doc(target.uid).set({
        uid:target.uid, email, name:text(body.name || target.displayName || email,120), role,
        active:body.active !== false, updatedAt:serverTimestamp(), updatedBy:decoded.uid
      }, { merge:true });
      return res.status(200).json({ ok:true, uid:target.uid, email, role, active:body.active !== false });
    }
    if (body.action === 'updateSupporters') {
      const siteUrl = text(body.siteUrl, 500);
      if (siteUrl) { const parsed = new URL(siteUrl); if (!['http:','https:'].includes(parsed.protocol)) throw new Error('invalid-url'); }
      await db.collection('platformSettings').doc('public').set({ supportersSiteUrl:siteUrl, updatedAt:serverTimestamp(), updatedBy:decoded.uid }, { merge:true });
      return res.status(200).json({ ok:true, siteUrl });
    }
    return res.status(400).json({ error:'Ação inválida.' });
  } catch (error) {
    console.error('Erro na administração acadêmica', error?.message || error);
    return res.status(401).json({ error:error?.message === 'invalid-url' ? 'Use um endereço https:// válido.' : 'Não foi possível validar a operação administrativa.' });
  }
};
