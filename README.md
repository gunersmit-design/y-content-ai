Firebase API Key

อยู่บัญชี witsanu19


git hub + Vercel ที่ขึ้นเซิฟ

อยู่ในบันชี gunnersmit




// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBGNHE_SsEEPboe0f_dGw9AwSkgW1kYclw",
  authDomain: "contentai-1f9f4.firebaseapp.com",
  projectId: "contentai-1f9f4",
  storageBucket: "contentai-1f9f4.firebasestorage.app",
  messagingSenderId: "338296412264",
  appId: "1:338296412264:web:ea637bfdc3239a7c7243dd",
  measurementId: "G-X0NQZBRB0J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);





สิ่งที่ต้องเพิ่ม/ทำ

1 ทำไมเวลาผมใส่ภาพถึงให้วิเคราะไม่ได้ทั้งที่เป็นตัวเสียตังหรือตัวโปร ตรงภาพอ้างอิง (ตัวละคร / ฉาก / สไตล์)ไม่บังคับ — ถ้าไม่มี AI จะคิดให้เอง อยากให้แก้กลับมาใช้งานได้

2 อยากให้เขียนรองรับหน้าจอทุกอันอะ

3 Gemini API Status หรือ เอไอตัวอื่นๆ
-ผมอยากให้เช็คเรียวทามว่ามันเหลือกี่ครั้งวันนี้โดยที่มีจำนวนบอกว่าอันไหนเหลือกี่อันอย่างไรช่วยทำให้ทีนะ

4 แยกคำสั่งเดิม
-ปกติจะได้ผลลัพรวมเวลาเราสร้างหรือใส่ข้อความออกมา อยากแยกให้มีกล่องคัดลอกอีกอันที่ไว้สร้างรูปตัวละครอะโดยโครงสร้างยังเหมือนเดิมอะแค่แยกกล่องออกมาเพิ่มอีก 1 แล้วมีปุ่มคัดลอกแยกกัน


นายมีอะไรแนะนำเกี่ยวกับระบบนี้แนะนำมาได้เลย



ผมจะให้นายช่วยเพิ่มหรือแก้ไขโค้ดนะ เดี๋ยวส่งไฟล์ให้

***ย้ำว่าโค้ดเก่าห้ามเปลี่ยนถ้าไม่ได้สั่ง***
-แต่ถ้านายอ่านแล้วควรปรับอะไรตรงไหนสามารถบอกแนะนำผมก่อนได้  
-นายไม่ต้องเขียนโค้ดเก่าเปรียบเทียบ 
-นายช่วยสร้าง log debug ในโค้ดเพื่อที่จะหาข้อผิดพลาดจะได้เจอง่ายๆ จะได้แก้ไขตรงจุด และ จะบำรุงรักษาภายในอนาคต


เดี๋ยวส่งให้เพิ่มนะรอคำสั่งได้เลย



คำสั่งอัพงาน


git add .
git commit -m "update"
git push