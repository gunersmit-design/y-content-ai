// lib/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai'

console.log('[gemini.js] โหลดไฟล์ gemini.js แล้ว')

// ── Init Gemini Client ────────────────────────────────────
console.log('[gemini.js] กำลัง init GoogleGenerativeAI...')
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
console.log('[gemini.js] GoogleGenerativeAI init สำเร็จ')

// ── Fallback Model List ───────────────────────────────────
// 🔴 BUG FIX: อัปเดต model names ให้ตรงกับที่ Google API รองรับในปัจจุบัน
// - gemini-2.0-flash    → ยังใช้ได้ (หลัก)
// - gemini-2.5-flash    → รุ่นใหม่ (สำรอง 1)
// - gemini-1.5-flash    → ยังใช้ได้ (สำรอง 2)
// - gemini-1.5-pro      → ❌ 404 แล้ว ลบออก
// - gemini-2.5-pro      → ใหม่แต่ quota สูง ใส่เป็นตัวสุดท้าย
const MODELS = [
  { name: 'gemini-2.0-flash',   label: 'Gemini 2.0 Flash (หลัก)' },
  { name: 'gemini-2.5-flash',   label: 'Gemini 2.5 Flash (สำรอง 1)' },
  { name: 'gemini-1.5-flash',   label: 'Gemini 1.5 Flash (สำรอง 2)' },
  { name: 'gemini-2.5-pro',     label: 'Gemini 2.5 Pro (สำรอง 3)' },
]

// ── Helper: เช็คว่า error ควร fallback ไหม ───────────────
function shouldFallback(error) {
  const msg = error.message || ''
  return (
    msg.includes('404') ||           // model ไม่มี / ถูก shut down
    msg.includes('not found') ||     // model ไม่มี
    msg.includes('429') ||           // rate limit
    msg.includes('quota') ||         // quota หมด
    msg.includes('RESOURCE_EXHAUSTED') // quota หมด
  )
}

// ── Helper: สร้าง Prompt ──────────────────────────────────
function buildPrompt(productData) {
  console.log('[gemini.js][buildPrompt] กำลังสร้าง prompt จาก productData:', productData)

  const { productName, price, highlights, targetGroup } = productData

  const prompt = `
คุณคือนักเขียน Content Marketing มืออาชีพสำหรับสินค้าไทย
กรุณาสร้าง Content ภาษาไทยจากข้อมูลต่อไปนี้

ชื่อสินค้า: ${productName}
ราคา: ${price} บาท
จุดเด่น: ${highlights}
กลุ่มลูกค้า: ${targetGroup}

โปรดสร้างครบทุกหัวข้อต่อไปนี้ โดยใส่หัวข้อนำทุกส่วน:

Hook: (ประโยคเปิดดึงดูดความสนใจ 1-2 ประโยค)

Script: (สคริปต์พูดสินค้าสั้นๆ 3-5 ประโยค เหมาะกับ TikTok/Reels)

แคปชั่น: (แคปชั่นโพสต์ขายสินค้า 2-3 บรรทัด)

ชื่อ Shopee: (ชื่อสินค้าสำหรับลงขาย Shopee ที่ติด SEO)

Hashtag: (hashtag ภาษาไทยและอังกฤษ 8-10 อัน)

เวลาโพสต์: (แนะนำเวลาและวันที่เหมาะสมสำหรับกลุ่มลูกค้านี้)

CHARACTER_PROMPT: (prompt ภาษาอังกฤษสำหรับสร้างรูปตัวละครหรือนางแบบที่เหมาะกับสินค้านี้ ระบุ: เพศ อายุโดยประมาณ รูปลักษณ์ เครื่องแต่งกาย สีผม สีตา อารมณ์/ท่าทาง และ background scene ให้ละเอียดและพร้อมนำไปใช้กับ Midjourney/Stable Diffusion ได้เลย)

ใช้ภาษาไทยที่เป็นธรรมชาติ เข้าถึงกลุ่มเป้าหมาย และกระตุ้นให้ซื้อ
ยกเว้นหัวข้อ CHARACTER_PROMPT ให้เขียนเป็นภาษาอังกฤษเท่านั้น
`.trim()

  console.log('[gemini.js][buildPrompt] สร้าง prompt สำเร็จ ความยาว:', prompt.length, 'ตัวอักษร')
  return prompt
}

// ── Helper: แยก CHARACTER_PROMPT ออกจาก content หลัก ────
function parseCharacterPrompt(rawText) {
  console.log('[gemini.js][parseCharacterPrompt] เริ่ม parse CHARACTER_PROMPT จาก rawText ความยาว:', rawText?.length)

  // หา section CHARACTER_PROMPT: ... (จนถึงบรรทัดว่างถัดไปหรือจบไฟล์)
  const match = rawText.match(/CHARACTER_PROMPT:\s*([\s\S]+?)(?=\n\n[^\s]|\n[A-Z]|\n[ก-๙]|$)/i)

  if (!match) {
    console.warn('[gemini.js][parseCharacterPrompt] ไม่พบ CHARACTER_PROMPT section ใน response')
    return { mainContent: rawText.trim(), characterContent: null }
  }

  const characterContent = match[1].trim()
  console.log('[gemini.js][parseCharacterPrompt] พบ CHARACTER_PROMPT ความยาว:', characterContent.length)

  // ลบ CHARACTER_PROMPT section ออกจาก mainContent
  const mainContent = rawText.replace(/CHARACTER_PROMPT:\s*[\s\S]+?(?=\n\n[^\s]|\n[A-Z]|\n[ก-๙]|$)/i, '').trim()
  console.log('[gemini.js][parseCharacterPrompt] mainContent หลัง parse ความยาว:', mainContent.length)

  return { mainContent, characterContent }
}

// ── tryGenerate: ลอง generate กับ model ที่กำหนด ─────────
async function tryGenerate(modelName, prompt) {
  console.log(`[gemini.js][tryGenerate] กำลังลอง model: ${modelName}`)
  const model = genAI.getGenerativeModel({ model: modelName })
  const result = await model.generateContent(prompt)
  const text = result.response.text()
  console.log(`[gemini.js][tryGenerate] model ${modelName} สำเร็จ ความยาว:`, text.length)
  return text
}

// ── Main Function ─────────────────────────────────────────
export async function generateContent(productData) {
  console.log('[gemini.js][generateContent] เริ่มต้น function')
  console.log('[gemini.js][generateContent] productData ที่ได้รับ:', productData)

  // ── Validate input ────────────────────────────────────
  const requiredFields = ['productName', 'price', 'highlights', 'targetGroup']
  for (const field of requiredFields) {
    if (!productData[field]) {
      console.error(`[gemini.js][generateContent] ERROR: ขาด field "${field}"`)
      throw new Error(`กรุณากรอกข้อมูล "${field}" ให้ครบถ้วน`)
    }
  }
  console.log('[gemini.js][generateContent] ตรวจสอบ input ครบแล้ว ✅')

  const prompt = buildPrompt(productData)
  let lastError = null

  // ── Fallback Loop ─────────────────────────────────────
  for (let i = 0; i < MODELS.length; i++) {
    const { name, label } = MODELS[i]
    console.log(`[gemini.js][generateContent] ลองใช้ model ${i + 1}/${MODELS.length}: ${label}`)

    try {
      const text = await tryGenerate(name, prompt)

      console.log(`[gemini.js][generateContent] ✅ สำเร็จด้วย model: ${label}`)
      return {
        success: true,
        content: text,
        modelUsed: name,
        modelLabel: label,
      }

    } catch (error) {
      lastError = error
      console.error(`[gemini.js][generateContent] ❌ model ${label} ล้มเหลว:`, error.message)

      if (shouldFallback(error)) {
        if (i < MODELS.length - 1) {
          console.log(`[gemini.js][generateContent] ⚡ สลับไป model ถัดไป: ${MODELS[i + 1].label}`)
          continue
        }
      } else {
        // error ที่ไม่ใช่ rate limit / model ไม่มี → หยุดทันที ไม่ต้อง fallback
        console.error('[gemini.js][generateContent] ERROR ที่ไม่ควร fallback:', error.message)
        break
      }
    }
  }

  // ── ถ้า fallback ทุกตัวแล้วยังไม่ได้ ─────────────────
  console.error('[gemini.js][generateContent] ERROR: ทุก model ล้มเหลวแล้ว')

  if (lastError?.message?.includes('API_KEY') || lastError?.message?.includes('API key')) {
    throw new Error('Gemini API Key ไม่ถูกต้อง กรุณาตรวจสอบ .env.local')
  }

  if (lastError?.message?.includes('quota') || lastError?.message?.includes('429')) {
    throw new Error('Gemini API เกิน quota ทุก model แล้ว กรุณาลองใหม่ภายหลัง')
  }

  throw new Error(`เกิดข้อผิดพลาดจาก Gemini: ${lastError?.message}`)
}