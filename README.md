# ToshkaPWA — تطبيق ويب تقدمي

تطبيق PWA بـ HTML + CSS + JavaScript فقط، مرتبط بـ Toshka Barber Backend.

---

## 📁 الملفات

```
ToshkaPWA/
├── index.html          ← SPA كاملة (تسجيل دخول + تسجيل 4 خطوات)
├── manifest.json       ← PWA manifest (اسم، أيقونة، لون)
├── sw.js               ← Service Worker (offline + caching)
├── css/
│   └── style.css       ← كل التصميم (dark gold theme)
├── js/
│   ├── i18n.js         ← نصوص عربي/إنجليزي
│   ├── api.js          ← HTTP calls للـ Backend
│   └── app.js          ← منطق التطبيق كامل
└── icons/
    ├── icon-192.svg
    └── icon-512.svg
```

---

## 🚀 تشغيل محلي

```bash
# خيار 1: Python
python3 -m http.server 3000

# خيار 2: Node.js
npx serve .

# خيار 3: VS Code Live Server
# افتح index.html واضغط Go Live
```

---

## ⚙️ ربط الـ Backend

في `js/api.js` غيّر:

```javascript
const API_BASE = 'http://localhost:5000';
```

---

## 📱 تثبيت كـ PWA

### iOS Safari
1. افتح الموقع في Safari
2. اضغط على زر المشاركة ⬆️
3. اختر "Add to Home Screen"
4. اضغط Add

### Android Chrome
1. افتح الموقع في Chrome
2. ستظهر رسالة "Install App" تلقائياً
3. أو من القائمة → "Add to Home Screen"

---

## 🎨 نظام الألوان

```css
--gold:    #D4AF37   /* ذهبي — الأزرار والتمييز */
--bg:      #0A0A0A   /* خلفية سوداء */
--card:    #1A1A1A   /* بطاقات و inputs */
--white:   #FFFFFF   /* نصوص */
--gray:    #A0A0A0   /* نصوص ثانوية */
```

---

## 🌐 اللغات

- **العربية**: RTL — الخط Cairo
- **English**: LTR — Cairo font
- الاختيار يُحفظ في `localStorage`
