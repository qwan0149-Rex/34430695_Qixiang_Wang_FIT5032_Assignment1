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
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore'

export const authState = reactive({ user: null, role: null, ready: false })

export function initAuth() {
  onAuthStateChanged(auth, async (u) => {
    authState.user = u
    if (u) {
      const ref = doc(db, 'users', u.uid)
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        await setDoc(
          ref,
          {
            uid: u.uid,
            name: u.displayName ?? '',
            email: (u.email || '').toLowerCase(),
            role: 'user',
            createdAt: serverTimestamp(),
          },
          { merge: true },
        )
        authState.role = 'user'
      } else {
        authState.role = snap.data().role ?? 'user'
      }
    } else {
      authState.role = null
    }
    authState.ready = true
  })
}

export async function register({ name, email, password /*, role ignored */ }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName: name })
  const ref = doc(db, 'users', cred.user.uid)
  await setDoc(
    ref,
    {
      uid: cred.user.uid,
      name,
      email: email.toLowerCase(),
      role: 'user',
      createdAt: serverTimestamp(),
    },
    { merge: true },
  )
  try {
    const statsRef = doc(db, 'stats', 'global')
    await updateDoc(statsRef, {
      usersTotal: increment(1),
    })
  } catch (e) {
    console.warn('stats/global not initialized yet:', e?.message)
  }
  authState.user = cred.user
  authState.role = 'user'
  return cred.user
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function logout() {
  await signOut(auth)
}
