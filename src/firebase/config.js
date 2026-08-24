import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyDud2K8F9fXEIFBHaSJFmu5-sGo5c0uZIk",
  authDomain: "atalaia-admin.firebaseapp.com",
  projectId: "atalaia-admin",
  storageBucket: "atalaia-admin.firebasestorage.app",
  messagingSenderId: "307511647732",
  appId: "1:307511647732:web:2e1aaa436e223ecbec6da1"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)