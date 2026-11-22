# Uplang

เว็บฝึกคำศัพท์ Oxford 5000 ด้วย React, Vite, Tailwind CSS และคอมโพเนนต์ shadcn/ui ในโปรเจกต์ โจทย์มีประโยคตัวอย่างภาษาอังกฤษและตัวเลือกเป็นคำแปลภาษาไทย

## เริ่มใช้งาน

ใช้ Node.js 22

```sh
npm ci
npm run dev
```

เมื่อยังไม่ได้ตั้งค่า Firebase โหมดพัฒนาจะเล่นได้ครบ 5,000 รายการและบันทึกสถิติในเบราว์เซอร์ เปิดแท็บสถิติเพื่อค้นหาคำหรือเรียงตามจำนวนที่ตอบถูกและผิด

```sh
npm test
npm run build
```

## Firebase Emulator Suite

ติดตั้ง Firebase CLI และ Java สำหรับ Firestore Emulator แล้วเปิดจากโฟลเดอร์โปรเจกต์

```sh
firebase emulators:start --project demo-uplang
```

อีกเทอร์มินัลหนึ่งให้รัน

```sh
VITE_FIREBASE_API_KEY=demo-key \
VITE_FIREBASE_AUTH_DOMAIN=demo-uplang.firebaseapp.com \
VITE_FIREBASE_PROJECT_ID=demo-uplang \
VITE_FIREBASE_APP_ID=demo-app \
VITE_FIREBASE_EMULATORS=true \
npm run dev
```

Vite ส่งต่อ `/api/*` ไปยัง Hosting Emulator ที่พอร์ต 5500 ส่วน Firebase Auth ใช้พอร์ต 9099

## Deploy ไป Firebase Hosting

1. สร้างโปรเจกต์ Firebase ที่ใช้แผน Blaze สำหรับ Cloud Functions Gen 2 สร้าง Web App และฐานข้อมูล Cloud Firestore แบบ default แนะนำ location `asia-southeast1` เพื่อให้ตรงกับตำแหน่งของ Function
2. เปิด **Authentication → Sign-in method → Anonymous** แล้วคัดลอก `.env.example` เป็น `.env.local` กรอกค่า Web App และให้ `VITE_FIREBASE_EMULATORS=false`
3. รันคำสั่งต่อไปนี้โดยแทน `YOUR_PROJECT_ID` ด้วย Firebase Project ID

```sh
firebase login
npm run build
firebase deploy --project YOUR_PROJECT_ID --only firestore,functions,hosting
```

Firebase Hosting ส่งต่อ `/api/**` ให้ Function `quizApi` บน Node.js 22 ตัว Function ตรวจ Firebase ID token และอัปเดตคำถาม ผลคำตอบ และสถิติต่อผู้ใช้ภายใน Firestore transaction ฐานข้อมูลเก็บความคืบหน้าตามบัญชี Anonymous ของเบราว์เซอร์ การล้างข้อมูลเว็บไซต์หรือเปลี่ยนเบราว์เซอร์จะสร้างบัญชีใหม่

## กติกา

- แต่ละข้อมีประโยคตัวอย่างภาษาอังกฤษและคำแปลภาษาไทย 8 ตัวเลือก รายการที่ตอบถูกจะออกจากการสุ่มจนเริ่มรอบใหม่
- คำที่ตอบผิดจะแสดงเฉลยและกลับเข้าไปในคิวสุ่มหลังทำคำอื่นอีก 3–7 ข้อ เมื่อเหลือเฉพาะคำท้ายรอบ ระบบจะเลือกคำอื่นที่เหลือก่อนเมื่อทำได้
- รอบจบเมื่อตอบถูกครบทั้ง 5,000 รายการ กดเริ่มรอบใหม่ได้โดยยังเก็บสถิติสะสมเดิม
- คำสะกดเหมือนกันที่เป็นคนละรายการในต้นฉบับจะใช้ชนิดคำหรือบริบทแยกกัน จึงนับเป็น 5,000 รายการคำศัพท์ตามความหมาย

## ข้อมูลคำศัพท์

ใช้หัวคำ ชนิดคำ และระดับ CEFR จาก PDF [The Oxford 3000](https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000.pdf) และ [The Oxford 5000](https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_5000.pdf) ซึ่งเป็นส่วนเพิ่ม รายการ `an` ถูกนับรวมกับ `a, an` ให้เหลือ 5,000 ข้อ คำถามเลือกคำแปลหนึ่งความหมายต่อรายการ นิยามมาจาก [Princeton WordNet 3.0](https://wordnet.princeton.edu/) และนิยามที่เขียนเพิ่มใน `scripts/definitions.tsv` โปรเจกต์เป็นเครื่องมือฝึกอิสระ

ข้อมูลมีฟิลด์ `meaningTh` สำหรับคำแปลและ `example` สำหรับประโยคตัวอย่าง คำแปลเริ่มต้นสร้างด้วยการแปลอัตโนมัติจากนิยามภาษาอังกฤษ จึงยังควรตรวจทานความหมายและความสอดคล้องกับประโยคก่อนใช้เป็นเนื้อหาการสอนอย่างเป็นทางการ ประโยคตัวอย่างมาจาก WordNet 3.0, [English Dictionary](https://github.com/kaysting/english-dictionary) ซึ่งรวบรวมจาก [Free Dictionary API](https://dictionaryapi.dev/) และประโยคที่เขียนเพิ่ม ดูรายละเอียดแหล่งข้อมูลและสิทธิ์ใน `functions/data/SOURCES.md`

`functions/data/oxford.json` พร้อมใช้งานในโปรเจกต์ ถ้าต้องการสร้างไฟล์ใหม่ ให้ส่งข้อความที่แยกจาก PDF ตามลำดับคอลัมน์ให้ `python3 scripts/build-catalog.py oxford3000.txt oxford5000.txt WordNet-3.0/dict` ดูสัญญาอนุญาต WordNet ใน `functions/data/WORDNET-LICENSE.txt`

สคริปต์สร้างรายการจะรักษาคำแปลและประโยคตัวอย่างจากไฟล์เดิมตามคำศัพท์ ชนิดคำ และบริบท หากมีรายการใหม่ที่ยังไม่มีข้อมูลส่วนนี้ สคริปต์จะหยุดแทนการเขียนทับข้อมูลที่พร้อมใช้งาน
