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

export default function ResultBox({ result }) {
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)

  const handleCopy = async () => {
    const ok = await copyToClipboard(result)
    if (ok) {
      setCopied(true)
      setCopyFailed(false)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setCopyFailed(true)
      setTimeout(() => setCopyFailed(false), 3000)
    }
  }

  if (!result) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-700">✅ Video Prompt ที่สร้างได้</h3>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 text-sm font-medium rounded-xl px-4 py-2 transition-all ${
            copied
              ? 'bg-green-500 text-white'
              : copyFailed
              ? 'bg-red-500 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {copied ? '✅ Copied!' : copyFailed ? '❌ Copy ไม่ได้ — เลือกข้อความเองนะครับ' : '📋 Copy ทั้งหมด'}
        </button>
      </div>
      <pre className="w-full bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans overflow-auto max-h-[70vh]">
        {result}
      </pre>
    </div>
  )
}