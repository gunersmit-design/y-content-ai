// app/page.jsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

console.log('[page.jsx] โหลดไฟล์ page.jsx (หน้าแรก) แล้ว')

export default function HomePage() {
  console.log('[page.jsx][HomePage] render HomePage')

  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGoogleLogin = async () => {
    console.log('[page.jsx][handleGoogleLogin] เริ่ม Google Login')
    setLoading(true)
    setError(null)

    try {
      console.log('[page.jsx][handleGoogleLogin] กำลังเรียก signInWithPopup...')
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      console.log('[page.jsx][handleGoogleLogin] Login สำเร็จ user:', user.displayName, user.email)
      router.push('/dashboard')

    } catch (err) {
      console.error('[page.jsx][handleGoogleLogin] ERROR:', err.message)
      setError('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    } finally {
      console.log('[page.jsx][handleGoogleLogin] จบ flow login')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">

        {/* Logo / Title */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-indigo-600 mb-2">ContentAI</h1>
          <p className="text-gray-500 text-sm">
            สร้างคำอธิบายสินค้าภาษาไทย<br />ด้วยพลัง Gemini AI
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all rounded-xl px-6 py-3 text-gray-700 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Google Icon */}
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.29-8.16 2.29-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
        </button>

        <p className="mt-6 text-xs text-gray-400">
          การเข้าสู่ระบบถือว่าคุณยอมรับเงื่อนไขการใช้งาน
        </p>
      </div>
    </main>
  )
}