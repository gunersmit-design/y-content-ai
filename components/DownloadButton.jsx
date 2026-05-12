// components/DownloadButton.jsx
'use client'

console.log('[DownloadButton.jsx] โหลดไฟล์ DownloadButton.jsx แล้ว')

export default function DownloadButton({ content }) {
  console.log('[DownloadButton.jsx][DownloadButton] render DownloadButton')

  const handleDownloadTxt = () => {
    console.log('[DownloadButton.jsx][handleDownloadTxt] เริ่ม download .txt')

    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `content-ai-${Date.now()}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log('[DownloadButton.jsx][handleDownloadTxt] download .txt สำเร็จ')
    } catch (err) {
      console.error('[DownloadButton.jsx][handleDownloadTxt] ERROR:', err.message)
    }
  }

  const handleDownloadHtml = () => {
    console.log('[DownloadButton.jsx][handleDownloadHtml] เริ่ม download .html')

    try {
      const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>ContentAI Output</title>
  <style>
    body { font-family: sans-serif; max-width: 700px; margin: 40px auto; line-height: 1.8; color: #333; }
    h1 { color: #4f46e5; }
    pre { background: #f9fafb; padding: 24px; border-radius: 12px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>ContentAI — ผลลัพธ์</h1>
  <pre>${content}</pre>
</body>
</html>`

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `content-ai-${Date.now()}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log('[DownloadButton.jsx][handleDownloadHtml] download .html สำเร็จ')
    } catch (err) {
      console.error('[DownloadButton.jsx][handleDownloadHtml] ERROR:', err.message)
    }
  }

  if (!content) {
    console.log('[DownloadButton.jsx][DownloadButton] ไม่มี content → ไม่ render')
    return null
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleDownloadTxt}
        className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl py-2.5 text-sm transition"
      >
        ⬇️ Download .txt
      </button>
      <button
        onClick={handleDownloadHtml}
        className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-xl py-2.5 text-sm transition"
      >
        ⬇️ Download .html
      </button>
    </div>
  )
}