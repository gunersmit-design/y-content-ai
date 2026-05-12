// app/dashboard/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import ProductForm from '@/components/ProductForm'
import ResultBox from '@/components/ResultBox'
import DownloadButton from '@/components/DownloadButton'

console.log('[dashboard/page.jsx] โหลดไฟล์ dashboard/page.jsx แล้ว')

export default function DashboardPage() {
  console.log('[dashboard] โหลดหน้า Dashboard')

  const router = useRouter()
  const [user, setUser]           = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult]       = useState(null)
  const [history, setHistory]     = useState([])
  const [error, setError]         = useState(null)
  const [productName, setProductName] = useState('')

  // ── Auth Guard ────────────────────────────────────────
  useEffect(() => {
    console.log('[dashboard/page.jsx][useEffect] ลงทะเบียน onAuthStateChanged')

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('[dashboard/page.jsx][onAuthStateChanged] user:', currentUser?.email ?? 'ไม่มี user')

      if (!currentUser) {
        console.log('[dashboard/page.jsx][onAuthStateChanged] ไม่มี user → redirect ไปหน้าแรก')
        router.push('/')
        return
      }

      setUser(currentUser)
      setAuthLoading(false)
      await fetchHistory(currentUser.uid)
    })

    return () => {
      console.log('[dashboard/page.jsx][useEffect] unsubscribe onAuthStateChanged')
      unsubscribe()
    }
  }, [router])

  // ── ดึงประวัติจาก Firestore ───────────────────────────
  const fetchHistory = async (uid) => {
    console.log('[dashboard] ดึงประวัติจาก Firestore uid:', uid)
    try {
      const q = query(
        collection(db, 'history'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
      const snapshot = await getDocs(q)
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setHistory(items)
      console.log('[dashboard/page.jsx] ดึงประวัติสำเร็จ จำนวน:', items.length, 'รายการ')
    } catch (err) {
      console.error('[dashboard] ERROR: ดึงประวัติล้มเหลว:', err.message)
    }
  }

  // ── Logout ────────────────────────────────────────────
  const handleLogout = async () => {
    console.log('[dashboard/page.jsx][handleLogout] เริ่ม logout')
    try {
      await signOut(auth)
      console.log('[dashboard/page.jsx][handleLogout] logout สำเร็จ → redirect')
      router.push('/')
    } catch (err) {
      console.error('[dashboard/page.jsx][handleLogout] ERROR:', err.message)
    }
  }

  // ── Generate ──────────────────────────────────────────
  const handleGenerate = async (formData) => {
    console.log('[dashboard] เรียก API generate, formData:', formData)

    setIsLoading(true)
    setError(null)
    setResult(null)
    setProductName(formData.productName)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user.uid }),
      })

      const data = await response.json()
      console.log('[dashboard] ได้รับผลลัพธ์แล้ว status:', response.status)

      if (!response.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดจาก API')

      setResult(data.content)
      console.log('[dashboard/page.jsx] set result สำเร็จ')

      // รีเฟรช history หลัง generate สำเร็จ
      await fetchHistory(user.uid)

    } catch (err) {
      console.error('[dashboard] ERROR:', err.message)
      setError(err.message)
    } finally {
      setIsLoading(false)
      console.log('[dashboard/page.jsx][handleGenerate] จบ flow generate')
    }
  }

  // ── Loading Auth ──────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">กำลังโหลด...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-green-600">ContentAI</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">👋 {user?.displayName}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        <div>
          <h2 className="text-2xl font-bold text-gray-800">สร้าง Content สินค้า</h2>
          <p className="text-gray-500 text-sm mt-1">กรอกข้อมูลสินค้า แล้วให้ AI สร้าง Content ให้คุณ</p>
        </div>

        {/* Form */}
        <ProductForm onSubmit={handleGenerate} isLoading={isLoading} />

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            ❌ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <ResultBox result={result} />
            {/* 🔴 BUG FIX: เปลี่ยน prop จาก result → content */}
            <DownloadButton content={result} productName={productName} />
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">🕐 ประวัติ 10 รายการล่าสุด</h3>
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-700">{item.productName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.createdAt?.toDate
                        ? item.createdAt.toDate().toLocaleString('th-TH')
                        : 'กำลังบันทึก...'}
                    </p>
                  </div>
                  <button
                    onClick={() => setResult(item.result)}
                    className="text-xs text-green-600 hover:text-green-800 border border-green-200 rounded-lg px-2.5 py-1 transition"
                  >
                    ดูผลลัพธ์
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}