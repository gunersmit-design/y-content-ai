// app/dashboard/page.jsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import ProductForm from '@/components/ProductForm'
import ResultBox from '@/components/ResultBox'
import DownloadButton from '@/components/DownloadButton'
import UsageBox from '@/components/UsageBox'
import LoadingOverlay from '@/components/LoadingOverlay'

console.log('[dashboard/page.jsx] โหลดไฟล์ dashboard/page.jsx แล้ว')

// ── GeminiStatusBox Component ─────────────────────────────
function GeminiStatusBox() {
  const [statusData, setStatusData] = useState(null)
  const [loading, setLoading]       = useState(false)
  const [lastChecked, setLastChecked] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const fetchStatus = useCallback(async () => {
    console.log('[GeminiStatusBox] กำลังเช็ค Gemini status...')
    setLoading(true)
    try {
      const res = await fetch('/api/gemini-status')
      const data = await res.json()
      setStatusData(data)
      setLastChecked(new Date())
      console.log('[GeminiStatusBox] ได้ status:', data)
    } catch (err) {
      console.error('[GeminiStatusBox] ERROR:', err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStatus() }, [fetchStatus])

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ok':          return { dot: 'bg-green-400', text: 'text-green-600', label: 'พร้อมใช้งาน' }
      case 'quota':       return { dot: 'bg-yellow-400', text: 'text-yellow-600', label: 'Quota เต็ม' }
      case 'unavailable': return { dot: 'bg-gray-300',   text: 'text-gray-400',   label: 'ไม่พร้อมใช้' }
      case 'auth_error':  return { dot: 'bg-red-400',    text: 'text-red-500',    label: 'API Key ผิด' }
      default:            return { dot: 'bg-red-400',    text: 'text-red-500',    label: 'มีข้อผิดพลาด' }
    }
  }

  const availableCount = statusData?.models?.filter(m => m.status === 'ok').length ?? 0
  const totalCount     = statusData?.models?.length ?? 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">

      {/* ── Header ── */}
      {/* [แก้ข้อ 2] เปลี่ยนเป็น flex-col บนจอเล็ก → flex-row บนจอใหญ่ ป้องกัน overflow */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

        {/* ชื่อ + badge */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">🤖</span>
          <span className="text-sm font-semibold text-gray-700 truncate">Gemini API Status</span>
          {statusData && !loading && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
              availableCount > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
            }`}>
              {availableCount}/{totalCount} พร้อมใช้
            </span>
          )}
        </div>

        {/* ปุ่มควบคุม */}
        {/* [แก้ข้อ 2] จัดชิดซ้ายบนมือถือ ชิดขวาบนจอใหญ่ ไม่มีขยายเกินกรอบ */}
        <div className="flex items-center gap-2 flex-wrap">
          {lastChecked && (
            <span className="text-xs text-gray-400 whitespace-nowrap">
              เช็คล่าสุด {lastChecked.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="text-xs text-purple-600 hover:text-purple-800 border border-purple-200 hover:bg-purple-50 rounded-lg px-2.5 py-1 transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? '⏳' : '🔄 รีเฟรช'}
          </button>
          <button
            onClick={() => setIsExpanded(p => !p)}
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1 transition whitespace-nowrap"
          >
            {isExpanded ? '▲ ย่อ' : '▼ รายละเอียด'}
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {/* [แก้ข้อ 2] skeleton ใช้ grid เหมือน collapsed view → ไม่ล้นจอมือถือ */}
      {loading && !statusData && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Collapsed view */}
      {statusData && !isExpanded && (
        // [แก้ข้อ 2] grid-cols-2 บนมือถือ → grid-cols-4 บนจอใหญ่ ไม่ล้นออกไปด้านข้าง
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {statusData.models.map((m) => {
            const s = getStatusStyle(m.status)
            return (
              <div
                key={m.name}
                className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 min-w-0"
                title={m.error || s.label}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot} ${m.status === 'ok' ? 'animate-pulse' : ''}`} />
                {/* [แก้ข้อ 2] truncate ป้องกันชื่อยาวล้น */}
                <span className="text-xs text-gray-600 truncate">{m.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Expanded view */}
      {statusData && isExpanded && (
        <div className="mt-3 space-y-2">
          {statusData.models.map((m) => {
            const s = getStatusStyle(m.status)
            return (
              <div key={m.name} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot} ${m.status === 'ok' ? 'animate-pulse' : ''}`} />
                  {/* [แก้ข้อ 2] truncate ชื่อ model ไม่ล้น */}
                  <span className="text-sm text-gray-700 font-medium truncate">{m.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {m.status === 'ok' && <span className="text-xs text-gray-400">{m.latencyMs}ms</span>}
                  {m.error && <span className="text-xs text-gray-400 hidden sm:inline">{m.error}</span>}
                  <span className={`text-xs font-medium ${s.text} whitespace-nowrap`}>{s.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Dashboard Page ────────────────────────────────────────
export default function DashboardPage() {
  console.log('[dashboard] โหลดหน้า Dashboard')

  const router = useRouter()
  const [user, setUser]               = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isLoading, setIsLoading]     = useState(false)
  const [result, setResult]           = useState(null)
  // [แก้ข้อ 3] เพิ่ม state สำหรับ characterContent แยกต่างหาก
  const [characterContent, setCharacterContent] = useState(null)
  const [history, setHistory]         = useState([])
  const [error, setError]             = useState(null)
  const [productName, setProductName] = useState('')

  // ── refreshTrigger: เพิ่มทุกครั้งที่ generate สำเร็จ → UsageBox จะ refetch ──
  const [usageRefreshTrigger, setUsageRefreshTrigger] = useState(0)

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

  // ── Clear result + error ──────────────────────────────
  const handleClear = () => {
    console.log('[dashboard/page.jsx][handleClear] ล้าง result, characterContent และ error')
    setResult(null)
    // [แก้ข้อ 3] ล้าง characterContent ด้วยเวลากด Clear
    setCharacterContent(null)
    setError(null)
    setProductName('')
  }

  // ── Generate ──────────────────────────────────────────
  const handleGenerate = async (formData) => {
    console.log('[dashboard] เรียก API generate, formData:', formData)

    setIsLoading(true)
    setError(null)
    setResult(null)
    // [แก้ข้อ 3] ล้าง characterContent ก่อน generate ใหม่
    setCharacterContent(null)
    setProductName(formData.productName)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: user.uid }),
      })

      const data = await response.json()
      console.log('[dashboard] ได้รับผลลัพธ์แล้ว status:', response.status)
      // [แก้ข้อ 3] log ให้เห็น characterContent ที่ได้จาก API
      console.log('[dashboard/page.jsx] characterContent length:', data.characterContent?.length ?? 0)

      if (!response.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดจาก API')

      setResult(data.content)
      // [แก้ข้อ 3] รับ characterContent จาก API แล้วเก็บใน state
      setCharacterContent(data.characterContent || null)
      console.log('[dashboard/page.jsx] set result และ characterContent สำเร็จ ✅')

      // trigger UsageBox ให้ refetch
      setUsageRefreshTrigger(prev => prev + 1)

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

      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isLoading} />

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

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">

        <div>
          <h2 className="text-2xl font-bold text-gray-800">สร้าง Content สินค้า</h2>
          <p className="text-gray-500 text-sm mt-1">กรอกข้อมูลสินค้า แล้วให้ AI สร้าง Content ให้คุณ</p>
        </div>

        {/* Status row: Gemini API + Usage แบบ 2 คอลัมน์ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GeminiStatusBox />
          <UsageBox userId={user?.uid} refreshTrigger={usageRefreshTrigger} />
        </div>

        {/* Form */}
        <ProductForm
          onSubmit={handleGenerate}
          isLoading={isLoading}
          onClear={handleClear}
        />

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            ❌ {error}
          </div>
        )}

        {/* Result */}
        {/* [แก้ข้อ 3] ส่ง characterContent ไปให้ ResultBox แสดงกล่องที่ 2 */}
        {result && (
          <div className="space-y-4">
            <ResultBox result={result} characterContent={characterContent} />
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
                  {/* [แก้ข้อ 3] กด "ดูผลลัพธ์" จากประวัติให้โหลด characterPrompt ด้วย */}
                  <button
                    onClick={() => {
                      console.log('[dashboard/page.jsx][history] โหลดผลลัพธ์จากประวัติ id:', item.id)
                      setResult(item.result)
                      setCharacterContent(item.characterPrompt || null)
                    }}
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