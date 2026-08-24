import { firebaseReady } from '../firebase/firebase-client.js';

if (firebaseReady) {
  const { auth, authSdk, db, firestoreSdk } = await firebaseReady;
  authSdk.onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try {
      const [studentDoc, staffDoc] = await Promise.all([
        firestoreSdk.getDoc(firestoreSdk.doc(db,'students',user.uid)),
        firestoreSdk.getDoc(firestoreSdk.doc(db,'staff',user.uid))
      ]);
      const staffPreview = staffDoc.exists() && staffDoc.data().active === true;
      const paidStudent = studentDoc.exists() && studentDoc.data().enrollmentStatus === 'paid';
      if (!staffPreview && paidStudent) {
      const key = `emp-access-${user.uid}`;
      if (!sessionStorage.getItem(key)) {
        const { collection, doc, setDoc, addDoc, increment, serverTimestamp } = firestoreSdk;
        const payload = {
          studentId:user.uid,
          lastAccessAt:serverTimestamp(),
          lastPath:location.pathname,
          accessCount:increment(1)
        };
        await Promise.all([
          setDoc(doc(db,'students',user.uid,'analytics','access'), payload, { merge:true }),
          addDoc(collection(db,'students',user.uid,'accessLogs'), {
            studentId:user.uid,
            accessedAt:serverTimestamp(),
            path:location.pathname,
            device:matchMedia('(max-width: 760px)').matches ? 'mobile' : 'desktop'
          })
        ]);
        sessionStorage.setItem(key, new Date().toISOString());
      }
      }
    } catch (error) {
      console.warn('Registro de acesso acadêmico indisponível.', error?.code || error?.message || error);
    }
  });
}
