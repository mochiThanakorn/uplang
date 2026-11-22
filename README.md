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
2. เปิด **Authentication → Sign-in method → Google** เลือกอีเมลติดต่อของโปรเจกต์ และตรวจโดเมนของเว็บใน **Authentication → Settings → Authorized domains** สำหรับ build ในเครื่องให้สร้าง `.env.local` โดยใช้ชื่อตัวแปรทั้งสี่ตามตัวอย่างด้านบนและค่าจาก Firebase Web App พร้อมตั้ง `VITE_FIREBASE_EMULATORS=false`
3. รันคำสั่งต่อไปนี้โดยแทน `YOUR_PROJECT_ID` ด้วย Firebase Project ID

```sh
firebase login
npm run build
firebase deploy --project YOUR_PROJECT_ID --only firestore,functions,hosting
```

Firebase Hosting ส่งต่อ `/api/**` ให้ Function `quizApi` บน Node.js 22 ตัว Function ตรวจ Firebase ID token และอัปเดตคำถาม ผลคำตอบ และสถิติต่อผู้ใช้ภายใน Firestore transaction ฐานข้อมูลแยกความคืบหน้าตาม Firebase UID ของบัญชี Google ผู้ใช้กลับมาใช้บัญชีเดิมจากเครื่องอื่นได้ หน้าแอดมินแสดงอีเมลและประวัติรายคำหลังผู้ใช้เปิดหน้าฝึกหรือสถิติครั้งแรก

ผู้เยี่ยมชมเดิมสามารถเชื่อมบัญชี Google ที่ยังไม่เคยใช้กับแอปเพื่อเก็บ UID และประวัติเดิมของเบราว์เซอร์ได้ ถ้าเลือกบัญชี Google ที่มีอยู่ในแอปแล้ว ระบบจะเปิดประวัติของบัญชีนั้น โดยไม่รวมประวัติโหมดผู้เยี่ยมชม

### สิทธิ์แอดมิน

ให้ผู้ดูแลเข้าสู่ระบบด้วย Google ครั้งแรกก่อน จากนั้นรันด้วย Google Application Default Credentials ที่มีสิทธิ์จัดการผู้ใช้ Firebase Authentication ของโปรเจกต์

```sh
node scripts/set-admin.mjs uplang-98cca admin@example.com grant
```

ออกจากระบบแล้วเข้าสู่ระบบใหม่เพื่อรับสิทธิ์และเปิดเมนูแอดมิน ใช้ `revoke` เพื่อยกเลิกสิทธิ์ใน token ที่ออกใหม่ ส่วน token ที่ออกไปแล้วใช้ได้จนหมดอายุ เซิร์ฟเวอร์ตรวจ claim `admin` ใน ID token ทุกครั้งก่อนอ่านรายชื่อหรือประวัติของผู้ใช้อื่น

### Deploy อัตโนมัติจาก GitHub Actions

เมื่อ push หรือ merge เข้า `dev` workflow จะทดสอบและ build ด้วย Node.js 22 แล้ว deploy Firestore rules/indexes, Function `quizApi` และ Hosting ไปยัง `uplang-98cca`

1. ใน GitHub ใช้ Environment ชื่อ `beta` และตั้ง **Deployment branches and tags → Selected branches and tags** ให้ deploy ได้จาก branch `dev` เท่านั้น
2. เพิ่ม Environment variables ทั้งสี่ตัว `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` และ `VITE_FIREBASE_APP_ID` จาก Firebase Web App ของ `uplang-98cca` ใน Environment `beta`
3. เพิ่ม Environment secret ใน `beta` ชื่อ `FIREBASE_PRODUCTION_DEPLOY_SA` โดยใช้ JSON ของ service account สำหรับ deploy โดยเฉพาะ บัญชีนี้ต้องมีสิทธิ์ deploy Firebase Hosting, Cloud Functions, Firestore indexes และ Security Rules รวมถึงสิทธิ์ใช้งาน service account ที่รัน Function

PR Preview ใช้ Environment `preview` และ deploy เฉพาะ Hosting Preview ให้คัดลอก Variables ทั้งสี่ตัวจาก `beta` ไปที่ `preview` และใช้ Secret สำหรับ Hosting Preview ชื่อ `FIREBASE_SERVICE_ACCOUNT_UPLANG_98CCA` การเปิด Google Sign-in และการให้สิทธิ์แอดมินยังตั้งค่าแยกจาก workflow

หาก Firebase CLI แจ้งว่ายังไม่มีนโยบายล้างอิมเมจของ Cloud Functions ให้ผู้ดูแลตั้งนโยบายครั้งเดียวด้วย `firebase functions:artifacts:setpolicy --project uplang-98cca --location asia-southeast1`

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
