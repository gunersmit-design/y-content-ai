// app/layout.jsx
import './globals.css'

console.log('[layout.jsx] โหลดไฟล์ layout.jsx แล้ว')

export const metadata = {
  title: 'ContentAI - สร้าง Content สินค้าด้วย AI',
  description: 'เครื่องมือสร้างคำอธิบายสินค้าภาษาไทยด้วย Gemini AI',
}

export default function RootLayout({ children }) {
  console.log('[layout.jsx][RootLayout] render RootLayout')

  return (
    <html lang="th">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}