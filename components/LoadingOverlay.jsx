// components/LoadingOverlay.jsx
'use client'

import { useState, useEffect } from 'react'

const STEPS = [
  { icon: '🔍', text: 'วิเคราะห์ข้อมูลสินค้า...',        duration: 2200 },
  { icon: '🎨', text: 'คิด Scene และ Mood ของวิดีโอ...',  duration: 2400 },
  { icon: '✍️', text: 'เขียน Video Prompt...',             duration: 2200 },
  { icon: '🎭', text: 'สร้าง Character Prompt...',         duration: 2000 },
  { icon: '✨', text: 'ขัดเกลาคำสั่ง AI ให้สมบูรณ์...',   duration: 1800 },
]

export default function LoadingOverlay({ isVisible }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [dots, setDots]           = useState('')
  const [progress, setProgress]   = useState(0)

  // วน step
  useEffect(() => {
    if (!isVisible) { setStepIndex(0); setProgress(0); return }

    let current = 0
    const next = () => {
      current = (current + 1) % STEPS.length
      setStepIndex(current)
    }

    const timers = []
    let elapsed = 0
    STEPS.forEach((s, i) => {
      const t = setTimeout(() => { setStepIndex(i) }, elapsed)
      timers.push(t)
      elapsed += s.duration
    })

    return () => timers.forEach(clearTimeout)
  }, [isVisible])

  // dots animation
  useEffect(() => {
    if (!isVisible) return
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500)
    return () => clearInterval(id)
  }, [isVisible])

  // progress bar — เพิ่มขึ้นเรื่อยๆ แต่ไม่ถึง 100 จนกว่าจะเสร็จจริง
  useEffect(() => {
    if (!isVisible) { setProgress(0); return }
    setProgress(0)
    const id = setInterval(() => {
      setProgress(p => p < 88 ? p + 0.6 : p)
    }, 120)
    return () => clearInterval(id)
  }, [isVisible])

  if (!isVisible) return null

  const step = STEPS[stepIndex]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Top gradient bar */}
          <div className="h-1.5 bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="px-8 py-8 text-center">

            {/* Spinning orb */}
            <div className="relative mx-auto w-20 h-20 mb-6">
              {/* outer ring */}
              <div className="absolute inset-0 rounded-full border-4 border-purple-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
              {/* inner pulse */}
              <div className="absolute inset-2 rounded-full bg-purple-50 flex items-center justify-center">
                <span
                  key={stepIndex}
                  className="text-2xl animate-bounce"
                  style={{ animationDuration: '0.8s' }}
                >
                  {step.icon}
                </span>
              </div>
            </div>

            {/* Step text */}
            <p
              key={stepIndex}
              className="text-base font-semibold text-gray-800 mb-1 transition-all duration-300"
              style={{ animation: 'fadeSlideUp 0.35s ease both' }}
            >
              {step.text}{dots}
            </p>
            <p className="text-xs text-gray-400">AI กำลังสร้าง Prompt ที่ดีที่สุดให้คุณ</p>

            {/* Step indicators */}
            <div className="flex justify-center gap-1.5 mt-5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === stepIndex
                      ? 'w-6 bg-purple-500'
                      : i < stepIndex
                      ? 'w-1.5 bg-purple-300'
                      : 'w-1.5 bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* % */}
            <p className="text-xs text-purple-400 font-mono mt-3">
              {Math.round(progress)}%
            </p>
          </div>
        </div>

        {/* floating dots decoration */}
        <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-fuchsia-400 opacity-70 animate-ping" />
        <div className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-purple-400 opacity-50 animate-ping"
             style={{ animationDelay: '0.5s' }} />
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}