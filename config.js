/* ============================================================
   🔐 تنظیمات فایربیس «بانانا کوییز»
   ------------------------------------------------------------
   برای فعال‌شدن ورود با گوگل و لیدربورد جهانی:
   ۱) در console.firebase.google.com یک پروژه بساز (رایگان)
   ۲) Authentication → Sign-in method → Google را فعال کن
   ۳) Realtime Database را بساز (حالت آزمایشی نه — با قوانین ما)
   ۴) Project settings → Your apps → Web app → مقدار firebaseConfig
      را کپی و مثل نمونهٔ زیر اینجا بچسبان:

   window.BQ_FIREBASE_CONFIG = {
     apiKey: "...",
     authDomain: " projectName.firebaseapp.com ",
     databaseURL: "https://projectName-default-rtdb.firebaseio.com",
     projectId: "projectName",
     appId: "..."
   };

   ۵) در Authentication → Settings → Authorized domains،
      دامنهٔ سایتت (مثل banana-quiz.netlify.app) را اضافه کن
   ۶) در Rules دیتابیس این را بگذار:
      {
        "rules": {
          "users": {
            ".read": "auth != null",
            "$uid": { ".write": "auth != null && auth.uid === $uid" }
          }
        }
      }

   ⚠️ تا وقتی این مقدار null بماند، سایت کامل کار می‌کند —
   فقط ورود با گوگل و لیدربورد جهانی خاموش است (حالت مهمان).
   ============================================================ */
window.BQ_FIREBASE_CONFIG = null;
