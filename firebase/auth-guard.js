import { firebaseReady } from './firebase-client.js';

const loginUrl = '../pages/login.html';

if (!firebaseReady) {
  window.location.replace(`${loginUrl}?status=configure`);
} else {
  const { auth, authSdk, db, firestoreSdk } = await firebaseReady;
  authSdk.onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.replace(`${loginUrl}?status=login`);
      return;
    }
    try {
      const [staffSnapshot, studentSnapshot] = await Promise.all([
        firestoreSdk.getDoc(firestoreSdk.doc(db, 'staff', user.uid)),
        firestoreSdk.getDoc(firestoreSdk.doc(db, 'students', user.uid))
      ]);
      const isStaff = staffSnapshot.exists() && staffSnapshot.data().active === true;
      const student = studentSnapshot.exists() ? studentSnapshot.data() : null;
      const isEnrolled = student?.enrollmentStatus === 'paid';
      if (!isStaff && !isEnrolled) {
        window.location.replace(`${loginUrl}?status=enrollment`);
        return;
      }
      window.empStudentSession = { user, student, isStaff };
      document.dispatchEvent(new CustomEvent('student:authorized', { detail: window.empStudentSession }));
    } catch {
      window.location.replace(`${loginUrl}?status=firestore`);
    }
  });
}
