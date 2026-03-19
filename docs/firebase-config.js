// AciqTehsil Firebase Config & Auth Utilities
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
         sendEmailVerification, signOut, onAuthStateChanged,
         sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup,
         updateProfile }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query,
         serverTimestamp, doc, setDoc, getDoc }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7tZySeokwbYF98qdvbo9Oo_5xPz1jFpk",
  authDomain: "aciqtehsil.firebaseapp.com",
  projectId: "aciqtehsil",
  storageBucket: "aciqtehsil.firebasestorage.app",
  messagingSenderId: "994971512497",
  appId: "1:994971512497:web:27e3629dd9c748e4e47c90",
  measurementId: "G-8F2MD2C8W2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();

// ── Auth helpers ───────────────────────────────────────────────

export async function registerUser(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await sendEmailVerification(cred.user);
  await setDoc(doc(db, "users", cred.user.uid), {
    displayName,
    email,
    createdAt: serverTimestamp(),
    notified: false
  });
  return cred.user;
}

export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// Google sign-in: works for both new sign-ups and returning users
export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  const user = cred.user;
  // Upsert profile in Firestore — merge:true so existing data isn't overwritten
  await setDoc(doc(db, "users", user.uid), {
    displayName: user.displayName || user.email,
    email: user.email,
    createdAt: serverTimestamp(),
    notified: false
  }, { merge: true });
  return user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function logoutUser() {
  await signOut(auth);
}

export function onAuthChange(cb) {
  onAuthStateChanged(auth, cb);
}

// ── Firestore helpers ──────────────────────────────────────────

export async function saveComment(data) {
  // Store both serverTimestamp (for display) and a plain ms timestamp (for sorting without index)
  return addDoc(collection(db, "comments"), {
    ...data,
    createdAt: serverTimestamp(),
    createdMs: Date.now()
  });
}

export async function getComments() {
  // Fetch all comments without orderBy (no index needed), sort client-side by createdMs
  const snap = await getDocs(collection(db, "comments"));
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  // Sort newest first using the plain numeric timestamp
  docs.sort((a, b) => (b.createdMs || 0) - (a.createdMs || 0));
  return docs;
}

export async function saveApplication(data) {
  return addDoc(collection(db, "applications"), { ...data, createdAt: serverTimestamp() });
}

export async function saveBooking(data) {
  return addDoc(collection(db, "bookings"), { ...data, createdAt: serverTimestamp() });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function markNotified(uid) {
  await setDoc(doc(db, "users", uid), { notified: true }, { merge: true });
}
