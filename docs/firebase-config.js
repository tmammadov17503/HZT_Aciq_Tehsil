// AciqTehsil Firebase Config & Auth Utilities
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
         sendEmailVerification, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, setDoc, getDoc }
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

// ── Auth helpers ──────────────────────────────────────────────
export async function registerUser(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user);
  // Save profile to Firestore
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

export async function logoutUser() {
  await signOut(auth);
}

export function onAuthChange(cb) {
  onAuthStateChanged(auth, cb);
}

// ── Firestore helpers ─────────────────────────────────────────
export async function saveComment(data) {
  return addDoc(collection(db, "comments"), { ...data, createdAt: serverTimestamp() });
}

export async function getComments() {
  const q = query(collection(db, "comments"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
