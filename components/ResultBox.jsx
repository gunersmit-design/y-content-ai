// components/ResultBox.jsx
'use client'

import { useState } from 'react'

console.log('[ResultBox.jsx] โหลดไฟล์ ResultBox.jsx แล้ว')

async function copyToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return true } catch (_) {}
  }
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0'
    document.body.appendChild(el); el.focus(); el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch (_) { return false }
}

function CopyButton({ text, label = 'Copy ทั้งหมด' }) {
  const [state, setState] = useState('idle') // idle | copied | failed

  const handleCopy = async () => {
    const ok = await copyToClipboard(text)
    setState(ok ? 'copied' : 'failed')
    setTimeout(() => setState('idle'), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 text-sm font-medium rounded-xl px-4 py-2 transition-all whitespace-nowrap ${
        state === 'copied' ? 'bg-green-500 text-white scale-95'
        : state === 'failed' ? 'bg-red-500 text-white'
        : 'bg-purple-600 hover:bg-purple-700 active:scale-95 text-white'
      }`}
    >
      {state === 'copied' ? '✅ Copied!' : state === 'failed' ? '❌ ลองใหม่' : `📋 ${label}`}
    </button>
  )
}

function ResultCard({ title, badge, content, copyLabel, gradient, borderColor, badgeCls }) {
  if (!content) return null
  return (
    <div className={`rounded-2xl shadow-sm border ${borderColor} overflow-hidden`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 ${gradient}`}>
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">{title}</h3>
          {badge && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeCls}`}>{badge}</span>
          )}
        </div>
        <CopyButton text={content} label={copyLabel} />
      </div>
      {/* Content */}
      <div className="bg-white px-5 py-4">
        <pre className="w-full text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans overflow-auto max-h-[60vh]">
          {content}
        </pre>
      </div>
    </div>
  )
}

export default function ResultBox({ result, characterContent }) {
  if (!result) return null

  return (
    <div className="space-y-4">

      {/* กล่อง 1 — Video Prompt */}
      <ResultCard
        title="✅ Video Prompt ที่สร้างได้"
        badge="Video / Content"
        content={result}
        copyLabel="Copy Video Prompt"
        gradient="bg-gradient-to-r from-purple-50 to-fuchsia-50"
        borderColor="border-purple-200"
        badgeCls="bg-purple-100 text-purple-700"
      />

      {/* กล่อง 2 — Character Prompt */}
      {characterContent && (
        <>
          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">Character Prompt แยกต่างหาก</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <ResultCard
            title="🎭 Character Prompt"
            badge="สร้างรูปตัวละคร"
            content={characterContent}
            copyLabel="Copy Character Prompt"
            gradient="bg-gradient-to-r from-indigo-50 to-blue-50"
            borderColor="border-indigo-200"
            badgeCls="bg-indigo-100 text-indigo-700"
          />

          <p className="text-xs text-gray-400 text-center">
            💡 นำ Character Prompt ไปใช้กับ Midjourney, DALL-E, Stable Diffusion ได้เลย
          </p>
        </>
      )}
    </div>
  )
}