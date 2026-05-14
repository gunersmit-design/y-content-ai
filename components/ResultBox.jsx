// components/ResultBox.jsx
'use client'

import { useState } from 'react'

console.log('[ResultBox.jsx] โหลดไฟล์ ResultBox.jsx แล้ว')

// ── Copy with fallback ────────────────────────────────────
async function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (_) {}
  }
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch (_) {
    return false
  }
}

// ── CopyButton Component ──────────────────────────────────
function CopyButton({ text, label = 'Copy ทั้งหมด' }) {
  const [copied, setCopied]     = useState(false)
  const [failed, setFailed]     = useState(false)

  const handleCopy = async () => {
    console.log('[ResultBox.jsx][CopyButton] กด copy, text length:', text?.length)
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopied(true)
      setFailed(false)
      console.log('[ResultBox.jsx][CopyButton] copy สำเร็จ')
      setTimeout(() => setCopied(false), 2000)
    } else {
      setFailed(true)
      console.warn('[ResultBox.jsx][CopyButton] copy ล้มเหลว — fallback ก็ไม่ได้')
      setTimeout(() => setFailed(false), 3000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 text-sm font-medium rounded-xl px-4 py-2 transition-all whitespace-nowrap ${
        copied
          ? 'bg-green-500 text-white'
          : failed
          ? 'bg-red-500 text-white'
          : 'bg-purple-600 hover:bg-purple-700 text-white'
      }`}
    >
      {copied ? '✅ Copied!' : failed ? '❌ เลือกข้อความเองนะครับ' : `📋 ${label}`}
    </button>
  )
}

// ── ResultCard Component ──────────────────────────────────
function ResultCard({ title, content, copyLabel, accentColor = 'purple' }) {
  console.log(`[ResultBox.jsx][ResultCard] render "${title}", content length: ${content?.length}`)

  const accentMap = {
    purple: { header: 'text-purple-700', border: 'border-purple-100', bg: 'bg-purple-50/40' },
    indigo: { header: 'text-indigo-700', border: 'border-indigo-100', bg: 'bg-indigo-50/40' },
  }
  const accent = accentMap[accentColor] || accentMap.purple

  if (!content) {
    console.log(`[ResultBox.jsx][ResultCard] "${title}" — content ว่าง ไม่ render`)
    return null
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${accent.border} p-4 sm:p-6 space-y-3`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className={`text-base sm:text-lg font-semibold ${accent.header}`}>{title}</h3>
        <CopyButton text={content} label={copyLabel} />
      </div>
      <pre className={`w-full ${accent.bg} border border-gray-200 rounded-xl p-4 sm:p-5 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans overflow-auto max-h-[60vh]`}>
        {content}
      </pre>
    </div>
  )
}

// ── ResultBox — main export ───────────────────────────────
export default function ResultBox({ result, characterContent }) {
  console.log('[ResultBox.jsx][ResultBox] render, result length:', result?.length, '| characterContent length:', characterContent?.length)

  if (!result) {
    console.log('[ResultBox.jsx][ResultBox] ไม่มี result → ไม่ render')
    return null
  }

  return (
    <div className="space-y-4">
      {/* กล่อง 1 — Video Prompt */}
      <ResultCard
        title="✅ Video Prompt ที่สร้างได้"
        content={result}
        copyLabel="Copy Video Prompt"
        accentColor="purple"
      />

      {/* กล่อง 2 — Character Prompt (แสดงเฉพาะถ้ามีข้อมูล) */}
      {characterContent && (
        <ResultCard
          title="🎭 Character Prompt (สร้างรูปตัวละคร)"
          content={characterContent}
          copyLabel="Copy Character Prompt"
          accentColor="indigo"
        />
      )}
    </div>
  )
}