// components/ProductForm.jsx
'use client'

import { useState, useRef } from 'react'

console.log('[ProductForm.jsx] โหลดไฟล์ ProductForm.jsx แล้ว')

const VIDEO_STYLE_OPTIONS = [
  { value: 'cinematic', label: '🎬 Cinematic' },
  { value: 'anime', label: '🎌 Anime' },
  { value: 'realistic', label: '📷 Realistic' },
  { value: 'cartoon', label: '🎨 Cartoon' },
  { value: '3d render', label: '💎 3D Render' },
  { value: 'documentary', label: '🎥 Documentary' },
]

const AI_TARGET_OPTIONS = [
  { value: 'gemini',   label: '✨ Gemini Pro',  desc: 'Google — วิเคราะห์สินค้าลึก ภาษาไทยเป๊ะ' },
  { value: 'kling',    label: '🎬 Kling AI',    desc: 'Kuaishou — เน้น motion สมจริง' },
  { value: 'runway',   label: '🛫 Runway Gen-4', desc: 'เน้น cinematic & effects' },
  { value: 'hailuo',   label: '🌊 Hailuo AI',   desc: 'MiniMax — เน้นตัวละคร' },
  { value: 'pika',     label: '⚡ Pika 2.0',    desc: 'เน้น creative & stylized' },
  { value: 'sora',     label: '🌀 Sora',        desc: 'OpenAI — เน้น physics & world' },
  { value: 'vidu',     label: '🎭 Vidu',        desc: 'เน้นตัวละครและ story' },
]

const DURATION_OPTIONS = [
  { value: '8',  label: '8 วินาที' },
  { value: '12', label: '12 วินาที' },
  { value: '16', label: '16 วินาที' },
]

const initialState = {
  productName: '',
  videoStyle: 'cinematic',
  duration: '8',
  aiTarget: 'gemini',
  productDetails: '',
}

export default function ProductForm({ onSubmit, isLoading }) {
  console.log('[ProductForm.jsx][ProductForm] render ProductForm, isLoading:', isLoading)

  const [formData, setFormData] = useState(initialState)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const fileInputRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    console.log(`[ProductForm.jsx][handleChange] field: ${name}, value: ${value}`)
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // ✅ BUG FIX: validate ขนาดจริง ไม่ใช่แค่เขียน label
    const MAX_SIZE_MB = 5
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`ไฟล์ใหญ่เกิน ${MAX_SIZE_MB}MB กรุณาเลือกไฟล์ที่เล็กกว่านี้`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    console.log('[ProductForm.jsx][handleImageChange] เลือกไฟล์:', file.name, file.type, `(${(file.size/1024/1024).toFixed(2)}MB)`)

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result
      setImagePreview(base64)
      setImageBase64(base64)
      setImageFile(file)
      console.log('[ProductForm.jsx][handleImageChange] อ่าน base64 สำเร็จ ขนาด:', base64.length)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    console.log('[ProductForm.jsx][handleRemoveImage] ลบภาพออก')
    setImageFile(null)
    setImagePreview(null)
    setImageBase64(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('[ProductForm] กด Submit, ข้อมูลที่ส่ง:', { ...formData, hasImage: !!imageBase64 })

    if (!formData.productName || !formData.videoStyle || !formData.duration) {
      console.error('[ProductForm.jsx][handleSubmit] ERROR: กรอกข้อมูลไม่ครบ')
      alert('กรุณากรอกชื่อสินค้า/วิดีโอและเลือก Style')
      return
    }

    console.log('[ProductForm.jsx][handleSubmit] ส่ง formData ไปยัง onSubmit')
    onSubmit({ ...formData, imageBase64: imageBase64 || null })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-5">🎬 ข้อมูลสำหรับสร้าง Video Prompt</h3>

      <div className="space-y-4">

        {/* ชื่อสินค้า / ธีมวิดีโอ */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            ชื่อสินค้า / ธีมวิดีโอ <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            placeholder="เช่น ครีมบำรุงผิว Glow Serum, รองเท้า Nike Air Max"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
          />
        </div>

        {/* อัปโหลดภาพอ้างอิง */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            ภาพอ้างอิง (ตัวละคร / ฉาก / สไตล์)
            <span className="ml-2 text-xs text-gray-400 font-normal">ไม่บังคับ — ถ้าไม่มี AI จะคิดให้เอง</span>
          </label>

          {!imagePreview ? (
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all"
            >
              <span className="text-3xl mb-2">🖼️</span>
              <span className="text-sm text-gray-500">คลิกเพื่อเลือกภาพ</span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (สูงสุด 5MB)</span>
              <input
                id="image-upload"
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          ) : (
            <div className="relative w-full rounded-xl overflow-hidden border border-gray-200">
              <img
                src={imagePreview}
                alt="ภาพอ้างอิง"
                className="w-full h-48 object-cover"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm transition shadow"
              >
                ✕
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs px-3 py-1.5">
                📎 {imageFile?.name}
              </div>
            </div>
          )}
        </div>

        {/* AI Target */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            จะเอา Prompt ไปใช้กับ AI ไหน? <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {AI_TARGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, aiTarget: opt.value }))}
                className={`flex flex-col items-start px-3 py-2.5 rounded-xl text-sm border transition-all ${
                  formData.aiTarget === opt.value
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                <span className={`text-xs mt-0.5 ${formData.aiTarget === opt.value ? 'text-purple-200' : 'text-gray-400'}`}>
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            สไตล์วิดีโอ <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {VIDEO_STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, videoStyle: opt.value }))}
                className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                  formData.videoStyle === opt.value
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ความยาววิดีโอ */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            ความยาววิดีโอ
          </label>
          <div className="flex gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, duration: opt.value }))}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                  formData.duration === opt.value
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* รายละเอียดสินค้า — ✅ เปลี่ยนจาก details → productDetails */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            รายละเอียดสินค้า
            <span className="ml-2 text-xs text-gray-400 font-normal">
              AI จะวิเคราะห์ข้อมูลสินค้าแล้วแปลงเป็น scene, mood, ตัวละครให้อัตโนมัติ
            </span>
          </label>
          <textarea
            name="productDetails"
            value={formData.productDetails}
            onChange={handleChange}
            placeholder="เช่น เซรั่มบำรุงผิวหน้า สูตรไฮยาลูรอน ลดริ้วรอย เหมาะผู้หญิงอายุ 30+ ราคา 890 บาท กลิ่นดอกไม้อ่อนๆ บรรจุภัณฑ์สีชมพูทอง..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            💡 ยิ่งใส่รายละเอียดสินค้ามาก Prompt ยิ่งแม่นและตรงกับสินค้าของคุณ
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-semibold rounded-xl py-3 transition-colors disabled:cursor-not-allowed"
        >
          {isLoading ? '⏳ กำลังสร้าง Prompt...' : '✨ สร้าง Video Prompt'}
        </button>

      </div>
    </div>
  )
}