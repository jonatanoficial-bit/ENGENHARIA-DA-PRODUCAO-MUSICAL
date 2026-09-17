const crypto = require('crypto');
const { getDb, serverTimestamp } = require('./_firebase-admin');

const offers = { cqiymwjq: 'essencial', wuqbrxz6: 'profissional', '9824kdrk': 'premium' };
const approvedEvents = new Set(['PURCHASE_APPROVED', 'PURCHASE_COMPLETE', 'PURCHASE_COMPLETED']);
const blockedEvents = new Set(['PURCHASE_CANCELED', 'PURCHASE_REFUNDED', 'PURCHASE_CHARGEBACK', 'PURCHASE_EXPIRED', 'PURCHASE_DELAYED']);
const emailKey = (email) => crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex');
const toNumber = (value) => Number(String(value ?? '').replace(',', '.')) || 0;
const equalToken = (received, expected) => {
  if (!received || !expected) return false;
  const a = Buffer.from(String(received)); const b = Buffer.from(String(expected));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const bodyObject = (body) => typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});

module.exports = async (request, response) => {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido' });
  if (!equalToken(request.headers['x-hotmart-hottok'], process.env.HOTMART_HOTTOK)) return response.status(401).json({ error: 'Webhook não autorizado' });
  try {
    const payload = bodyObject(request.body);
    const data = payload.data || payload;
    const event = String(payload.event || data.event || '').toUpperCase();
    const buyer = data.buyer || payload.buyer || {};
    const purchase = data.purchase || payload.purchase || {};
    const offer = purchase.offer || data.offer || payload.offer || {};
    const email = String(buyer.email || '').trim().toLowerCase();
    const transaction = String(purchase.transaction || purchase.transaction_id || payload.id || crypto.randomUUID());
    if (!event || !email) return response.status(200).json({ received: true, ignored: 'Evento de teste sem comprador' });
    if (!approvedEvents.has(event) && !blockedEvents.has(event)) return response.status(200).json({ received:true, ignored:'Evento sem alteração de acesso' });

    const db = getDb(); const now = serverTimestamp();
    const offerCode = String(offer.code || offer.id || '').toLowerCase();
    const plan = offers[offerCode] || String(offer.name || 'curso').toLowerCase();
    const grossAmount = toNumber(purchase.price?.value ?? purchase.price ?? data.price);
    const commissionItem = Array.isArray(data.commissions) ? data.commissions.find((item) => item.value ?? item.amount) : null;
    const commissionAmount = toNumber(commissionItem?.value ?? commissionItem?.amount ?? purchase.commission?.value);
    const commissionPercentage = grossAmount > 0 && commissionAmount > 0 ? Math.round((commissionAmount / grossAmount) * 100) : null;
    const status = approvedEvents.has(event) ? 'approved' : blockedEvents.has(event) ? 'blocked' : 'pending';
    const enrollment = { email, buyerName: buyer.name || '', plan, offerCode, offerName: offer.name || '', source:'hotmart', enrollmentStatus: status === 'approved' ? 'paid' : status === 'blocked' ? 'blocked' : 'pending', latestTransaction: transaction, updatedAt: now };
    if (status === 'approved') enrollment.approvedAt = now;
    const eventTime = Number(payload.creation_date) || 0;
    await db.runTransaction(async (tx) => {
      const saleRef = db.collection('sales').doc(transaction);
      const enrollmentRef = db.collection('enrollments').doc(emailKey(email));
      const [saleDoc, enrollmentDoc, students] = await Promise.all([
        tx.get(saleRef), tx.get(enrollmentRef), tx.get(db.collection('students').where('email','==',email))
      ]);
      const previousSale = saleDoc.exists ? saleDoc.data() : {};
      const previousEnrollment = enrollmentDoc.exists ? enrollmentDoc.data() : {};
      // Re-delivered approvals must not revive a refunded/charged-back transaction.
      if (['PURCHASE_REFUNDED','PURCHASE_CHARGEBACK'].includes(previousSale.event) && status === 'approved') return;
      if (eventTime && previousSale.eventTime > eventTime) return;
      tx.set(saleRef, { transaction, event, status, buyerEmail: email, buyerName: buyer.name || '', plan, offerCode, offerName: offer.name || '', grossAmount, commissionAmount, commissionPercentage, updatedAt: now, approvedAt: previousSale.approvedAt || (status === 'approved' ? now : null), eventTime }, { merge:true });
      // A different purchase or a separately granted manual enrollment remains intact.
      const differentPurchase = previousEnrollment.latestTransaction && previousEnrollment.latestTransaction !== transaction;
      const manualAccess = previousEnrollment.source === 'team-direct' && previousEnrollment.enrollmentStatus === 'paid';
      if (manualAccess || (status === 'blocked' && differentPurchase)) return;
      if (eventTime && previousEnrollment.eventTime > eventTime) return;
      tx.set(enrollmentRef, { ...enrollment, eventTime }, { merge:true });
      students.docs.forEach((student) => {
        const data = student.data();
        if (status === 'blocked' && data.latestTransaction && data.latestTransaction !== transaction) return;
        tx.set(student.ref, { enrollmentStatus:enrollment.enrollmentStatus, plan, latestTransaction:transaction, updatedAt:now }, { merge:true });
      });
    });
    return response.status(200).json({ received: true, integration: 'emp-hotmart-v1.6.2', event, enrollmentStatus: enrollment.enrollmentStatus });
  } catch (error) {
    console.error('Erro Hotmart webhook', error);
    const isConfigurationError = /Firebase Admin|FIREBASE_SERVICE_ACCOUNT_JSON/.test(String(error?.message || ''));
    return response.status(isConfigurationError ? 503 : 500).json({ error: isConfigurationError ? 'Integração do Firebase Admin pendente na Vercel' : 'Não foi possível processar o evento' });
  }
};
