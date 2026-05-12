// app/api/generate/route.js
import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

console.log('[route.js] โหลดไฟล์ api/generate/route.js แล้ว')

// ═══════════════════════════════════════════════════════════
//  TIER 1 — Gemini API โดยตรง
//  ใช้ GEMINI_API_KEY จาก .env.local
//  model fallback: 2.0-flash → 2.5-flash → 1.5-flash
// ═══════════════════════════════════════════════════════════
const GEMINI_MODELS = [
  { name: 'gemini-2.0-flash',         vision: true  },
  { name: 'gemini-2.5-flash-preview', vision: true  },
  { name: 'gemini-1.5-flash',         vision: true  },
]

async function callGemini({ modelName, systemPrompt, userMessage, imageBase64 }) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('NO_KEY: GEMINI_API_KEY ไม่ถูกตั้งค่าใน .env.local')

  // ── build parts ──────────────────────────────────────────
  const parts = []
  if (imageBase64) {
    // base64 data URL → แยก mimeType และ data ออก
    const matches = imageBase64.match(/^data:(.+);base64,(.+)$/)
    if (matches) {
      parts.push({ inline_data: { mime_type: matches[1], data: matches[2] } })
    }
  }
  parts.push({ text: `${systemPrompt}\n\n${userMessage}` })

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.8 },
      }),
    }
  )

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    const msg = errData?.error?.message || res.status
    throw new Error(`Gemini error (${modelName}): ${msg}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error(`Gemini ไม่ส่งผลลัพธ์กลับมา (${modelName})`)

  return text
}

async function tryGeminiTier({ systemPrompt, userMessage, imageBase64 }) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('NO_KEY: GEMINI_API_KEY ไม่ถูกตั้งค่า')

  // ถ้ามีรูป → ใช้ vision model ทุกตัว (Gemini รองรับทั้งหมด)
  const models = imageBase64
    ? GEMINI_MODELS.filter(m => m.vision)
    : GEMINI_MODELS

  let lastError = null
  for (const { name } of models) {
    try {
      console.log(`[route.js][Tier1-Gemini] ลองใช้ model: ${name}`)
      const text = await callGemini({ modelName: name, systemPrompt, userMessage, imageBase64 })
      console.log(`[route.js][Tier1-Gemini] ✅ สำเร็จ model: ${name}, length: ${text.length}`)
      return text
    } catch (err) {
      lastError = err
      console.error(`[route.js][Tier1-Gemini] ❌ ${name} ล้มเหลว:`, err.message)
      // hard stop: API key ผิด หรือ 401
      if (err.message.includes('API_KEY_INVALID') || err.message.includes('401')) break
      // ถ้า 404 / 429 / quota → fallback model ถัดไป
    }
  }
  throw lastError
}

// ═══════════════════════════════════════════════════════════
//  TIER 2 — OpenRouter
//  ใช้ OPENROUTER_API_KEY จาก .env.local
//  model fallback เรียงจากถูก → แพง
// ═══════════════════════════════════════════════════════════
const OPENROUTER_MODELS = [
  { id: 'google/gemini-2.0-flash-001',     vision: true  },
  { id: 'google/gemini-2.5-flash-preview', vision: true  },
  { id: 'meta-llama/llama-4-maverick',     vision: true  },
  { id: 'meta-llama/llama-4-scout',        vision: false },
  { id: 'anthropic/claude-3.5-haiku',      vision: true  },
  { id: 'openai/gpt-4o-mini',              vision: true  },
]

async function callOpenRouter({ modelId, systemPrompt, userMessage, imageBase64 }) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('NO_KEY: OPENROUTER_API_KEY ไม่ถูกตั้งค่าใน .env.local')

  const userContent = imageBase64
    ? [
        { type: 'text', text: userMessage },
        { type: 'image_url', image_url: { url: imageBase64 } },
      ]
    : userMessage

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': 'ContentAI',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 2048,
      temperature: 0.8,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userContent  },
      ],
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(`OpenRouter error (${modelId}): ${errData?.error?.message || res.status}`)
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error(`OpenRouter ไม่ส่งผลลัพธ์กลับมา (${modelId})`)

  return text
}

async function tryOpenRouterTier({ systemPrompt, userMessage, imageBase64 }) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('NO_KEY: OPENROUTER_API_KEY ไม่ถูกตั้งค่า')

  const orderedModels = imageBase64
    ? [...OPENROUTER_MODELS.filter(m => m.vision), ...OPENROUTER_MODELS.filter(m => !m.vision)]
    : OPENROUTER_MODELS

  let lastError = null
  for (const { id: modelId } of orderedModels) {
    try {
      console.log(`[route.js][Tier2-OpenRouter] ลองใช้ model: ${modelId}`)
      const text = await callOpenRouter({ modelId, systemPrompt, userMessage, imageBase64 })
      console.log(`[route.js][Tier2-OpenRouter] ✅ สำเร็จ model: ${modelId}, length: ${text.length}`)
      return text
    } catch (err) {
      lastError = err
      console.error(`[route.js][Tier2-OpenRouter] ❌ ${modelId} ล้มเหลว:`, err.message)
      const msg = err.message || ''
      if (msg.includes('API_KEY') || msg.includes('API key') || msg.includes('401')) break
    }
  }
  throw lastError
}

// ═══════════════════════════════════════════════════════════
//  TIER 3 — Claude (Anthropic API)
//  ใช้ ANTHROPIC_API_KEY จาก .env.local
//  model fallback: claude-3-5-haiku → claude-3-5-sonnet
// ═══════════════════════════════════════════════════════════
const CLAUDE_MODELS = [
  { id: 'claude-haiku-4-5-20251001',  vision: true  }, // เร็ว + ถูก
  { id: 'claude-sonnet-4-5',          vision: true  }, // แรงขึ้น
]

async function callClaude({ modelId, systemPrompt, userMessage, imageBase64 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('NO_KEY: ANTHROPIC_API_KEY ไม่ถูกตั้งค่าใน .env.local')

  // ── build user content ────────────────────────────────
  const userContent = imageBase64
    ? (() => {
        const matches = imageBase64.match(/^data:(.+);base64,(.+)$/)
        if (!matches) return [{ type: 'text', text: userMessage }]
        return [
          {
            type: 'image',
            source: { type: 'base64', media_type: matches[1], data: matches[2] },
          },
          { type: 'text', text: userMessage },
        ]
      })()
    : [{ type: 'text', text: userMessage }]

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(`Claude error (${modelId}): ${errData?.error?.message || res.status}`)
  }

  const data = await res.json()
  const text = data?.content?.find(c => c.type === 'text')?.text
  if (!text) throw new Error(`Claude ไม่ส่งผลลัพธ์กลับมา (${modelId})`)

  return text
}

async function tryClaudeTier({ systemPrompt, userMessage, imageBase64 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('NO_KEY: ANTHROPIC_API_KEY ไม่ถูกตั้งค่า')

  const models = imageBase64
    ? CLAUDE_MODELS.filter(m => m.vision)
    : CLAUDE_MODELS

  let lastError = null
  for (const { id: modelId } of models) {
    try {
      console.log(`[route.js][Tier3-Claude] ลองใช้ model: ${modelId}`)
      const text = await callClaude({ modelId, systemPrompt, userMessage, imageBase64 })
      console.log(`[route.js][Tier3-Claude] ✅ สำเร็จ model: ${modelId}, length: ${text.length}`)
      return text
    } catch (err) {
      lastError = err
      console.error(`[route.js][Tier3-Claude] ❌ ${modelId} ล้มเหลว:`, err.message)
      const msg = err.message || ''
      if (msg.includes('authentication') || msg.includes('401')) break
    }
  }
  throw lastError
}

// ═══════════════════════════════════════════════════════════
//  MAIN callAI — 3-Tier Fallback Orchestrator
//  Tier1: Gemini → Tier2: OpenRouter → Tier3: Claude
// ═══════════════════════════════════════════════════════════
async function callAI({ productName, videoStyle, duration, productDetails, aiTarget, imageBase64 }) {

  // ── AI Guide per target ───────────────────────────────
  const aiGuides = {
    gemini: `
AI Target: Gemini Pro Video / Google AI
- เน้นการวิเคราะห์ข้อมูลสินค้าอย่างละเอียด แล้วสร้าง visual story ที่เชื่อมโยงกับ benefit ของสินค้า
- ระบุ key selling point ของสินค้าใน scene อย่างชัดเจน (เช่น เห็นผิวเนียน, เห็น packaging, เห็นผลลัพธ์)
- เน้น emotional connection — ให้ผู้ดูรู้สึกถึงประสบการณ์การใช้สินค้า
- ใส่ visual metaphor ที่สื่อถึง benefit เช่น ผิวชุ่มชื้น → น้ำใส หยดน้ำค้าง แสงอาทิตย์ยามเช้า
- Prompt ต้องสามารถ generate ได้จริงด้วย AI Video — ไม่ abstract เกินไป
- ใส่ "high quality", "4K", "professional product shot" เสมอ`,

    kling: `
AI Target: Kling AI (Kuaishou)
- เน้น keyword: natural motion, fluid movement, realistic physics
- ระบุ camera movement ชัดเจน เช่น "slow zoom in", "tracking shot"
- เพิ่ม lighting descriptor เสมอ เช่น "golden hour lighting", "soft diffused light"
- ใส่ duration hint: "smooth ${duration}-second clip"
- หลีกเลี่ยง: abstract concept, metaphor, over-complex scene`,

    runway: `
AI Target: Runway Gen-4
- เน้น cinematic quality: "cinematic 4K", "film grain", "anamorphic lens"
- ระบุ aspect ratio hint: 16:9 widescreen
- เพิ่ม color grading style เช่น "teal and orange grade", "desaturated palette"
- ใส่ motion style: "handheld", "dolly shot", "crane shot"
- เพิ่ม "high production value" และ "professional commercial" เสมอ`,

    hailuo: `
AI Target: Hailuo AI (MiniMax)
- เน้น character expression และ emotion อย่างละเอียด
- ระบุ facial expression ชัดเจน เช่น "gentle smile", "intense gaze"
- เพิ่ม body language descriptor
- เน้น portrait และ close-up shot สำหรับตัวละคร
- ใส่ background blur (bokeh) เพื่อเน้น subject`,

    pika: `
AI Target: Pika 2.0
- เน้น stylized และ creative visual มากกว่า realism
- ใส่ art style descriptor เช่น "painterly", "illustrated", "graphic novel style"
- เพิ่ม color palette ที่ bold และ vibrant
- ระบุ transition style: "morphing", "dissolve", "glitch effect"
- Prompt สั้นกระชับ keyword-focused มากกว่า sentence`,

    sora: `
AI Target: Sora (OpenAI)
- เน้น physics accuracy และ world consistency
- อธิบาย scene อย่างละเอียดเหมือนเขียน screenplay
- ระบุ time of day, weather, environment อย่างครบถ้วน
- เน้น "photorealistic", "natural lighting", "real-world setting"
- เพิ่ม subject interaction กับ environment`,

    vidu: `
AI Target: Vidu
- เน้น character-driven storytelling
- อธิบาย character action sequence อย่างละเอียด step-by-step
- ระบุ emotion arc ของตัวละครในคลิป
- เพิ่ม narrative hint เช่น "beginning → climax → end"
- เน้น expressive movement และ gesture`,
  }

  const guide = aiGuides[aiTarget] || aiGuides['gemini']
  const aiTargetLabel = aiTarget?.toUpperCase() || 'GEMINI'

  const systemPrompt = `คุณคือผู้เชี่ยวชาญด้านการเขียน Video Prompt สำหรับ AI Video Generator และนักการตลาดสินค้าไทย

${guide}

วิธีวิเคราะห์ข้อมูลสินค้า:
1. อ่านรายละเอียดสินค้าที่ได้รับ แล้วสกัด:
   - กลุ่มเป้าหมาย (เพศ อายุ ไลฟ์สไตล์)
   - จุดเด่นและ benefit หลัก
   - อารมณ์/ความรู้สึกที่สินค้าให้
   - โทนสี บรรยากาศที่เหมาะกับสินค้า
2. แปลงข้อมูลเหล่านี้เป็น visual scene ที่สื่อถึง benefit อย่างเป็นธรรมชาติ
3. คิด visual metaphor ที่เชื่อมโยงสินค้ากับอารมณ์ผู้ดู

สร้าง Video Prompt ที่ครบถ้วนและ optimize สำหรับ ${aiTargetLabel} โดยแบ่งออกเป็น section ดังนี้ (ใส่ชื่อ section ตามนี้ทุกครั้ง):

**Scene / ฉาก**
[อธิบายฉาก สถานที่ บรรยากาศ แสง สี — เชื่อมโยงกับ benefit ของสินค้า]

**Character / ตัวละคร**
[อธิบายตัวละคร ลักษณะ การแต่งกาย การกระทำ — ตรงกับกลุ่มเป้าหมายของสินค้า]

**Style / สไตล์ภาพ**
[สไตล์ภาพ, quality keywords, mood & tone — เหมาะกับ brand ของสินค้า]

**Camera Angle / มุมกล้อง**
[มุมกล้อง, การเคลื่อนกล้อง, ระยะ]

**Prompt ภาษาอังกฤษ**
[Prompt ฉบับเต็มในภาษาอังกฤษ optimize สำหรับ ${aiTargetLabel} พร้อมใช้งาน ยาว 3-5 ประโยค]

**Prompt ภาษาไทย**
[แปล Prompt ภาษาอังกฤษข้างต้นเป็นภาษาไทย]

ตอบเป็นภาษาไทยยกเว้น section Prompt ภาษาอังกฤษ`

  const userMessage = imageBase64
    ? `สร้าง Video Prompt สำหรับ ${aiTargetLabel} จากข้อมูลสินค้าและภาพอ้างอิงนี้:
- ชื่อสินค้า/ธีม: ${productName}
- สไตล์วิดีโอ: ${videoStyle}
- ความยาว: ${duration} วินาที
- รายละเอียดสินค้า: ${productDetails || 'ไม่ระบุ'}

ภาพอ้างอิงที่แนบมา: วิเคราะห์ตัวละคร ฉาก สไตล์ และอารมณ์จากภาพอย่างละเอียด
จาก "รายละเอียดสินค้า" ให้วิเคราะห์: กลุ่มเป้าหมาย, benefit หลัก, อารมณ์ที่สินค้าให้, โทนสี แล้วนำทุกอย่างมาสร้าง Prompt ที่ optimize สำหรับ ${aiTargetLabel} โดยเฉพาะ`
    : `สร้าง Video Prompt สำหรับ ${aiTargetLabel} จากข้อมูลสินค้านี้:
- ชื่อสินค้า/ธีม: ${productName}
- สไตล์วิดีโอ: ${videoStyle}
- ความยาว: ${duration} วินาที
- รายละเอียดสินค้า: ${productDetails || 'ไม่ระบุ'}

จาก "รายละเอียดสินค้า" ให้วิเคราะห์และสกัด: กลุ่มเป้าหมาย, benefit หลัก, อารมณ์/ความรู้สึกที่สินค้าให้, โทนสีที่เหมาะสม แล้วแปลงเป็น visual scene ที่น่าสนใจ และสร้าง Prompt ที่ optimize สำหรับ ${aiTargetLabel} โดยเฉพาะ`

  const args = { systemPrompt, userMessage, imageBase64 }

  // ── Tier 1: Gemini ────────────────────────────────────
  console.log('[route.js][callAI] 🔵 เริ่ม Tier 1: Gemini API')
  try {
    const text = await tryGeminiTier(args)
    console.log('[route.js][callAI] ✅ Tier 1 Gemini สำเร็จ')
    return { text, tier: 'Gemini' }
  } catch (err) {
    console.warn('[route.js][callAI] ⚠️ Tier 1 Gemini ล้มเหลวทั้งหมด:', err.message)
  }

  // ── Tier 2: OpenRouter ────────────────────────────────
  console.log('[route.js][callAI] 🟡 เริ่ม Tier 2: OpenRouter')
  try {
    const text = await tryOpenRouterTier(args)
    console.log('[route.js][callAI] ✅ Tier 2 OpenRouter สำเร็จ')
    return { text, tier: 'OpenRouter' }
  } catch (err) {
    console.warn('[route.js][callAI] ⚠️ Tier 2 OpenRouter ล้มเหลวทั้งหมด:', err.message)
  }

  // ── Tier 3: Claude ────────────────────────────────────
  console.log('[route.js][callAI] 🔴 เริ่ม Tier 3: Claude (Anthropic)')
  try {
    const text = await tryClaudeTier(args)
    console.log('[route.js][callAI] ✅ Tier 3 Claude สำเร็จ')
    return { text, tier: 'Claude' }
  } catch (err) {
    console.error('[route.js][callAI] ❌ Tier 3 Claude ล้มเหลวทั้งหมด:', err.message)
    throw new Error(`ทุก Tier ล้มเหลวแล้ว (Gemini → OpenRouter → Claude): ${err.message}`)
  }
}

// ═══════════════════════════════════════════════════════════
//  POST Handler
// ═══════════════════════════════════════════════════════════
export async function POST(request) {
  console.log('[route.js][POST] รับ request เข้ามา')

  let body
  try {
    body = await request.json()
  } catch (err) {
    console.error('[route.js][POST] ERROR: parse body ล้มเหลว:', err.message)
    return NextResponse.json({ error: 'Request body ไม่ถูกต้อง' }, { status: 400 })
  }

  const { userId, productName, videoStyle, duration, productDetails, aiTarget, imageBase64 } = body
  console.log('[route.js][POST] ข้อมูลที่ได้รับ:', { userId, productName, videoStyle, duration, aiTarget, hasImage: !!imageBase64 })

  if (!userId || !productName || !videoStyle || !duration) {
    console.error('[route.js][POST] ERROR: ข้อมูลไม่ครบ')
    return NextResponse.json(
      { error: 'กรุณากรอกข้อมูลให้ครบ (ชื่อ, สไตล์, ความยาว)' },
      { status: 400 }
    )
  }
  console.log('[route.js][POST] validate ผ่านแล้ว ✅')

  let result
  try {
    result = await callAI({ productName, videoStyle, duration, productDetails, aiTarget, imageBase64 })
    console.log(`[route.js][POST] AI ตอบกลับสำเร็จ tier: ${result.tier}, length: ${result.text.length}`)
  } catch (err) {
    console.error('[route.js][POST] ERROR: AI ทุก Tier ล้มเหลว:', err.message)
    return NextResponse.json(
      { error: `AI ล้มเหลว: ${err.message}` },
      { status: 500 }
    )
  }

  try {
    console.log('[route.js][POST] กำลังบันทึกลง Firestore collection "history"...')
    const docRef = await db.collection('history').add({
      userId,
      productName,
      videoStyle,
      duration,
      aiTarget: aiTarget || 'gemini',
      hasImage: !!imageBase64,
      result: result.text,
      tierUsed: result.tier,           // บันทึกว่าใช้ tier ไหนสำเร็จ
      createdAt: FieldValue.serverTimestamp(),
    })
    console.log('[route.js][POST] บันทึก Firestore สำเร็จ docId:', docRef.id)
  } catch (err) {
    console.error('[route.js][POST] ERROR: Firestore ล้มเหลว (non-fatal):', err.message)
  }

  console.log('[route.js][POST] ส่งผลลัพธ์กลับไป Frontend')
  return NextResponse.json({ content: result.text, tierUsed: result.tier }, { status: 200 })
}