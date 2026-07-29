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
        firestoreSdk.getDocFromServer(firestoreSdk.doc(db, 'staff', user.uid)),
        firestoreSdk.getDocFromServer(firestoreSdk.doc(db, 'students', user.uid))
      ]);
      const isStaff = staffSnapshot.exists() && staffSnapshot.data().active === true;
      const student = studentSnapshot.exists() ? studentSnapshot.data() : null;
      if (isStaff) {
        // Professores podem conferir a experiência do aluno sem precisar criar
        // uma matrícula fictícia. Este modo não representa uma compra e os
        // scripts da área do aluno não registram progresso, provas ou pedidos.
        document.documentElement.dataset.studentPreview = 'staff';
        document.querySelector('[data-staff-preview-notice]')?.removeAttribute('hidden');
        document.querySelector('[data-staff-preview-back]')?.removeAttribute('hidden');
        window.empStudentSession = { user, student, isStaff: true, staff: staffSnapshot.data(), preview: true };
        document.dispatchEvent(new CustomEvent('student:authorized', { detail: window.empStudentSession }));
        return;
      }
      const isEnrolled = student?.enrollmentStatus === 'paid';
      if (!isEnrolled) {
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
