// lib/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

console.log('[firebase.js] โหลดไฟล์ firebase.js แล้ว')

// ── Config ──────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

console.log('[firebase.js] firebaseConfig โหลดค่าจาก .env.local:', {
  projectId:  firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  appId:      firebaseConfig.appId,
})

// ── Init App (ป้องกัน init ซ้ำใน Next.js dev mode) ─────
let app
if (getApps().length === 0) {
  console.log('[firebase.js] ยังไม่มี Firebase App → กำลัง initializeApp...')
  app = initializeApp(firebaseConfig)
  console.log('[firebase.js] initializeApp สำเร็จ')
} else {
  console.log('[firebase.js] Firebase App มีอยู่แล้ว → ใช้ getApp()')
  app = getApp()
}

// ── Auth ─────────────────────────────────────────────────
console.log('[firebase.js] กำลัง init getAuth...')
const auth = getAuth(app)
console.log('[firebase.js] getAuth สำเร็จ:', auth.app.name)

// ── Google Auth Provider ─────────────────────────────────
console.log('[firebase.js] กำลังสร้าง GoogleAuthProvider...')
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
console.log('[firebase.js] GoogleAuthProvider พร้อมใช้งาน')

// ── Firestore ─────────────────────────────────────────────
console.log('[firebase.js] กำลัง init getFirestore...')
const db = getFirestore(app)
console.log('[firebase.js] getFirestore สำเร็จ')

console.log('[firebase.js] Export auth, db, googleProvider เรียบร้อย ✅')

export { auth, db, googleProvider }