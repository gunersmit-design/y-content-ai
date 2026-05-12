// app/api/gemini-status/route.js
// ตรวจสอบ quota status ของ Gemini แต่ละ model โดย ping ด้วย prompt สั้นๆ

import { GoogleGenerativeAI } from '@google/generative-ai'

const MODELS = [
  { name: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { name: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { name: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { name: 'gemini-2.5-pro',   label: 'Gemini 2.5 Pro' },
]

// ping แต่ละ model ด้วย token น้อยที่สุด
async function pingModel(genAI, modelName) {
  const start = Date.now()
  try {
    const model = genAI.getGenerativeModel({ model: modelName })
    await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
      generationConfig: { maxOutputTokens: 1 },
    })
    return { status: 'ok', latencyMs: Date.now() - start }
  } catch (err) {
    const msg = err.message || ''
    if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
      return { status: 'quota', latencyMs: Date.now() - start, error: 'เกิน quota' }
    }
    if (msg.includes('404') || msg.includes('not found')) {
      return { status: 'unavailable', latencyMs: Date.now() - start, error: 'Model ไม่พร้อมใช้งาน' }
    }
    if (msg.includes('API_KEY') || msg.includes('API key')) {
      return { status: 'auth_error', latencyMs: Date.now() - start, error: 'API Key ไม่ถูกต้อง' }
    }
    return { status: 'error', latencyMs: Date.now() - start, error: msg.slice(0, 80) }
  }
}

export async function GET() {
  console.log('[gemini-status/route.js] เริ่มเช็ค Gemini status')

  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: 'ไม่พบ GEMINI_API_KEY ใน .env.local' },
      { status: 500 }
    )
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

  // ping ทุก model พร้อมกัน
  const results = await Promise.all(
    MODELS.map(async ({ name, label }) => {
      const ping = await pingModel(genAI, name)
      return { name, label, ...ping }
    })
  )

  const anyAvailable = results.some((r) => r.status === 'ok')

  console.log('[gemini-status/route.js] ผลลัพธ์:', results)

  return Response.json({
    checkedAt: new Date().toISOString(),
    anyAvailable,
    models: results,
  })
}