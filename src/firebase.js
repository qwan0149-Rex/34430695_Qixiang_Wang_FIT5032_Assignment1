import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDAdC94xvzzDFu78hm74T5Obscz5Caz97k',
  authDomain: 'fit5032-assignment1-e5365.firebaseapp.com',
  projectId: 'fit5032-assignment1-e5365',
  storageBucket: 'fit5032-assignment1-e5365.firebasestorage.app',
  messagingSenderId: '1071185046300',
  appId: '1:1071185046300:web:599fb22eeb7209bb22a8d9',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
setPersistence(auth, browserLocalPersistence)
export const db = getFirestore(app)
