// lib/firebase-admin.js
// ใช้ใน Server-side เท่านั้น (API Routes, Server Components)
// ไม่ใช้ใน Client Component ('use client')

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

console.log('[firebase-admin.js] โหลดไฟล์ firebase-admin.js แล้ว')

// ── Init Admin App (ป้องกัน init ซ้ำใน Next.js dev mode) ─
let db

if (!getApps().length) {
  console.log('[firebase-admin.js] กำลัง init Firebase Admin App...')

  initializeApp({
    credential: cert({
      projectId:    process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail:  process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // private key ใน .env มี \n เป็น string → ต้อง replace ให้เป็น newline จริง
      privateKey:   process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })

  console.log('[firebase-admin.js] Firebase Admin App init สำเร็จ ✅')
} else {
  console.log('[firebase-admin.js] Firebase Admin App มีอยู่แล้ว → ใช้ของเดิม')
}

db = getFirestore()
console.log('[firebase-admin.js] getFirestore (Admin) สำเร็จ ✅')

export { db }