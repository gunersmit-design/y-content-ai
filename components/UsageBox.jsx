// components/UsageBox.jsx
// กล่องแสดงจำนวนครั้งที่ใช้งาน AI วันนี้ (นับจาก Firestore history จริง)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

console.log('[UsageBox.jsx] โหลดไฟล์ UsageBox.jsx แล้ว')

// ── กำหนด daily limit ต่อ AI (ปรับได้ตามแผน) ───────────
const DAILY_LIMITS = {
  gemini:       20,  // Gemini free tier ~1,500 req/day → ตั้งไว้ 20 ต่อ user
  kling:        10,
  runway:       10,
  hailuo:       10,
  pika:         10,
  sora:          5,  // Sora แพงกว่า จำกัดต่ำหน่อย
  vidu:         10,
}

const DEFAULT_LIMIT = 10

// ── สีตาม % ที่ใช้ไป ─────────────────────────────────────
function getUsageColor(used, limit) {
  const pct = used / limit
  if (pct >= 1)    return { bar: 'bg-red-500',    text: 'text-red-600',    bg: 'bg-red-50',    label: 'เต็มแล้ว' }
  if (pct >= 0.8)  return { bar: 'bg-orange-400', text: 'text-orange-600', bg: 'bg-orange-50', label: 'ใกล้เต็ม' }
  if (pct >= 0.5)  return { bar: 'bg-yellow-400', text: 'text-yellow-600', bg: 'bg-yellow-50', label: 'ปานกลาง' }
  return             { bar: 'bg-green-400',  text: 'text-green-600',  bg: 'bg-green-50',  label: 'ใช้ได้' }
}

// ── AI Display Names ──────────────────────────────────────
const AI_LABELS = {
  gemini:  '✨ Gemini',
  kling:   '🎬 Kling',
  runway:  '🛫 Runway',
  hailuo:  '🌊 Hailuo',
  pika:    '⚡ Pika',
  sora:    '🌀 Sora',
  vidu:    '🎭 Vidu',
}

export default function UsageBox({ userId, refreshTrigger }) {
  const [usageMap, setUsageMap] = useState({})   // { gemini: 5, kling: 2, ... }
  const [loading, setLoading]   = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [isExpanded, setIsExpanded]   = useState(false)

  const fetchUsage = useCallback(async () => {
    if (!userId) return
    console.log('[UsageBox] กำลังดึง usage จาก Firestore uid:', userId)
    setLoading(true)

    try {
      // ── หาช่วงวันนี้ (00:00:00 — 23:59:59 เวลาท้องถิ่น) ──
      const now   = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

      const q = query(
        collection(db, 'history'),
        where('userId', '==', userId),
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<=', Timestamp.fromDate(end)),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      const docs = snapshot.docs.map(d => d.data())

      // นับแยกตาม aiTarget
      const counts = {}
      docs.forEach((doc) => {
        const ai = doc.aiTarget || 'gemini'
        counts[ai] = (counts[ai] || 0) + 1
      })

      console.log('[UsageBox] usage วันนี้:', counts)
      setUsageMap(counts)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('[UsageBox] ERROR:', err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // โหลดครั้งแรก + ทุกครั้งที่มีการ generate ใหม่
  useEffect(() => { fetchUsage() }, [fetchUsage, refreshTrigger])

  // ── คำนวณ total วันนี้ ─────────────────────────────────
  const totalToday = Object.values(usageMap).reduce((a, b) => a + b, 0)

  // ── ดึง AI ที่มี usage หรือ limit ──────────────────────
  const aiList = Object.keys(DAILY_LIMITS)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <span className="text-sm font-semibold text-gray-700">การใช้งานวันนี้</span>
          {!loading && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
              {totalToday} ครั้ง
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              อัปเดต {lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={fetchUsage}
            disabled={loading}
            className="text-xs text-purple-600 hover:text-purple-800 border border-purple-200 hover:bg-purple-50 rounded-lg px-2.5 py-1 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '⏳' : '🔄'}
          </button>
          <button
            onClick={() => setIsExpanded(p => !p)}
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1 transition"
          >
            {isExpanded ? '▲ ย่อ' : '▼ รายละเอียด'}
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-3 space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-6 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Collapsed: แค่แถบ summary */}
      {!loading && !isExpanded && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {aiList.slice(0, 4).map((ai) => {
            const used  = usageMap[ai] || 0
            const limit = DAILY_LIMITS[ai] || DEFAULT_LIMIT
            const color = getUsageColor(used, limit)
            const pct   = Math.min((used / limit) * 100, 100)
            return (
              <div key={ai} className={`rounded-xl px-2.5 py-2 ${color.bg}`}>
                <p className="text-xs text-gray-500 truncate">{AI_LABELS[ai]}</p>
                <p className={`text-sm font-bold ${color.text}`}>{used}<span className="text-xs font-normal text-gray-400">/{limit}</span></p>
                <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${color.bar}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Expanded: รายละเอียดทุก AI */}
      {!loading && isExpanded && (
        <div className="mt-3 space-y-2.5">
          {aiList.map((ai) => {
            const used      = usageMap[ai] || 0
            const limit     = DAILY_LIMITS[ai] || DEFAULT_LIMIT
            const remaining = Math.max(limit - used, 0)
            const color     = getUsageColor(used, limit)
            const pct       = Math.min((used / limit) * 100, 100)

            return (
              <div key={ai}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{AI_LABELS[ai]}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${color.bg} ${color.text}`}>
                      {color.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>ใช้แล้ว <b className={color.text}>{used}</b> ครั้ง</span>
                    <span>เหลือ <b className="text-gray-700">{remaining}</b> ครั้ง</span>
                    <span className="text-gray-400">/{limit}</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}

          <p className="text-xs text-gray-400 pt-1">
            🔄 Quota รีเซ็ตทุกวันเที่ยงคืน — นับจากข้อมูลจริงใน Firestore
          </p>
        </div>
      )}

    </div>
  )
}