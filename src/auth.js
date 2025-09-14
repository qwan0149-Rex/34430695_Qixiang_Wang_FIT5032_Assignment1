// src/auth.js
import { reactive } from 'vue'
import { auth, db } from './firebase'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export const authState = reactive({ user: null, role: null, ready: false })

export function initAuth() {
  onAuthStateChanged(auth, async (u) => {
    authState.user = u
    if (u) {
      const snap = await getDoc(doc(db, 'users', u.uid))
      authState.role = snap.exists() ? snap.data().role : 'user'
    } else {
      authState.role = null
    }
    authState.ready = true
  })
}

export async function register({ name, email, password, role = 'user' }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName: name })
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    name,
    email: email.toLowerCase(),
    role,
    createdAt: new Date().toISOString(),
  })
  authState.user = cred.user
  authState.role = role
  return cred.user
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function logout() {
  await signOut(auth)
}
