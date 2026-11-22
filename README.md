# Uplang

เว็บฝึกคำศัพท์ Oxford 5000 ด้วย React, Vite, Tailwind CSS และคอมโพเนนต์ shadcn/ui ในโปรเจกต์ โจทย์มีประโยคตัวอย่างภาษาอังกฤษและตัวเลือกเป็นคำแปลภาษาไทย

## ความสามารถ

- ฝึกคำศัพท์ 5,000 รายการ พร้อมชนิดคำ ระดับ CEFR และประโยคตัวอย่าง เลือกคำแปลภาษาไทยจาก 8 ตัวเลือก
- หลังตอบจะแสดงความหมายเต็มและคำแปลภาษาไทยของประโยคตัวอย่าง พร้อมนำคำที่ตอบผิดกลับมาทบทวน
- ฟังการออกเสียงผ่านระบบเสียงของเบราว์เซอร์ ใช้ปุ่ม `1`–`8` เลือกคำตอบ และ `Enter` ไปคำถัดไปหลังตอบ
- ดูความคืบหน้าในรอบ จำนวนข้อที่ตอบถูกต่อเนื่อง ความแม่นยำ และประวัติรายคำที่ค้นหาและเรียงลำดับได้
- เข้าสู่ระบบด้วย Google เพื่อเก็บความคืบหน้าใน Firestore และใช้งานบัญชีเดิมข้ามเครื่อง ผู้ดูแลดูประวัติรายคำของผู้ใช้ได้
- หน้าจอรองรับทั้งมือถือและเดสก์ท็อป

## เริ่มใช้งาน

ใช้ Node.js 22

```sh
npm ci
npm run dev
```

เปิด URL ที่ Vite แสดงในเทอร์มินัล โดยปกติคือ `http://127.0.0.1:5173`

เมื่อไม่ได้กำหนด `VITE_FIREBASE_PROJECT_ID` โหมดพัฒนาจะเล่นได้ครบ 5,000 รายการโดยไม่ต้องเข้าสู่ระบบ และบันทึกความคืบหน้ากับสถิติใน `localStorage` ของเบราว์เซอร์ หากมี `.env.local` ที่ตั้งค่า Firebase อยู่แล้ว ให้ลบค่าตัวแปรนี้หรือรัน `VITE_FIREBASE_PROJECT_ID= npm run dev` เพื่อใช้โหมดในเครื่อง ข้อมูลโหมดนี้แยกจากบัญชี Google และไม่ซิงก์ไปยัง Firestore

ตรวจสอบโปรเจกต์และสร้างไฟล์สำหรับ deploy:

```sh
npm test
npm run build
```

`npm ci` ที่โฟลเดอร์หลักติดตั้ง dependencies ของทั้งเว็บและ workspace `functions` ส่วน `npm test` รันชุดทดสอบใน `functions/*.test.js` และ `npm run build` สร้างเว็บไว้ที่ `dist/`

## การตั้งค่า Firebase

สร้าง `.env.local` ที่โฟลเดอร์หลักด้วยค่าจาก Firebase Web App:

```dotenv
VITE_FIREBASE_API_KEY=YOUR_WEB_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT_ID.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_APP_ID=YOUR_WEB_APP_ID
VITE_FIREBASE_EMULATORS=false
```

ค่าทั้งสี่ของ Web App ต้องครบเพื่อใช้งาน Firebase ส่วน `VITE_FIREBASE_EMULATORS=true` ใช้เชื่อม Auth Emulator และเปิด Vite proxy สำหรับ `/api` ต้องเริ่ม Vite ใหม่หลังแก้ไฟล์ env และ build ใหม่หากต้องการเปลี่ยนค่าของเว็บที่ deploy แล้ว

เว็บที่ build สำหรับ production ต้องตั้งค่า Firebase จึงจะใช้งานได้ และต้องเข้าสู่ระบบด้วย Google ก่อนฝึกหรือดูสถิติ ไม่มีการสร้างบัญชีผู้เยี่ยมชมใหม่

## Firebase Emulator Suite

ติดตั้ง Firebase CLI และ Java สำหรับ Firestore Emulator แล้วเปิดจากโฟลเดอร์โปรเจกต์

```sh
npm run build
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

เปิดเว็บผ่าน URL ของ Vite และเข้าสู่ระบบผ่านหน้าจอจำลอง Google Sign-in โดย Vite ส่งต่อ `/api/*` ไปยัง Hosting Emulator ที่พอร์ต 5500 ซึ่งส่งต่อให้ Function `quizApi`

| Emulator | พอร์ต |
| --- | --- |
| Authentication | 9099 |
| Functions | 5001 |
| Firestore | 8080 |
| Hosting | 5500 |

โปรเจกต์ปิด Emulator UI ไว้ตาม `firebase.json` ข้อมูลใน emulator จะไม่ถูกเก็บข้ามการปิดและเปิดใหม่หากไม่ได้ใช้ตัวเลือก import/export ของ Firebase CLI

## Deploy ไป Firebase Hosting

1. สร้างโปรเจกต์ Firebase ที่ใช้แผน Blaze สำหรับ Cloud Functions Gen 2 สร้าง Web App และฐานข้อมูล Cloud Firestore แบบ default แนะนำ location `asia-southeast1` เพื่อให้ตรงกับตำแหน่งของ Function
2. เปิด **Authentication → Sign-in method → Google** เลือกอีเมลติดต่อของโปรเจกต์ และตรวจโดเมนของเว็บใน **Authentication → Settings → Authorized domains** สำหรับ build ในเครื่องให้สร้าง `.env.local` ตามหัวข้อการตั้งค่า Firebase พร้อมตั้ง `VITE_FIREBASE_EMULATORS=false`
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
node scripts/set-admin.mjs YOUR_PROJECT_ID admin@example.com grant
```

ออกจากระบบแล้วเข้าสู่ระบบใหม่เพื่อรับสิทธิ์และเปิดเมนูแอดมิน ใช้ `revoke` เพื่อยกเลิกสิทธิ์ใน token ที่ออกใหม่ ส่วน token ที่ออกไปแล้วใช้ได้จนหมดอายุ เซิร์ฟเวอร์ตรวจ claim `admin` ใน ID token ทุกครั้งก่อนอ่านรายชื่อหรือประวัติของผู้ใช้อื่น

### Deploy อัตโนมัติจาก GitHub Actions

เมื่อ push หรือ merge เข้า `main` workflow จะทดสอบและ build ด้วย Node.js 22 แล้ว deploy Firestore rules/indexes, Function `quizApi` และ Hosting ไปยัง `uplang-98cca`

1. ใน GitHub ใช้ Environment ชื่อ `beta` และตั้ง **Deployment branches and tags → Selected branches and tags** ให้ deploy ได้จาก branch `main` เท่านั้น
2. เพิ่ม Environment variables ทั้งสี่ตัว `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` และ `VITE_FIREBASE_APP_ID` จาก Firebase Web App ของ `uplang-98cca` ใน Environment `beta`
3. เพิ่ม Environment secret ใน `beta` ชื่อ `FIREBASE_PRODUCTION_DEPLOY_SA` โดยใช้ JSON ของ service account สำหรับ deploy โดยเฉพาะ บัญชีนี้ต้องมีสิทธิ์ deploy Firebase Hosting, Cloud Functions, Firestore indexes และ Security Rules รวมถึงสิทธิ์ใช้งาน service account ที่รัน Function

PR Preview ทำงานเฉพาะ PR จาก repository เดียวกัน ใช้ Environment `preview` และ deploy เฉพาะ Hosting Preview ให้คัดลอก Variables ทั้งสี่ตัวจาก `beta` ไปที่ `preview` และใช้ Secret สำหรับ Hosting Preview ชื่อ `FIREBASE_SERVICE_ACCOUNT_UPLANG_98CCA` ตัว preview ใช้ API ที่ deploy อยู่แล้วในโปรเจกต์ `uplang-98cca` จึงยังไม่รวมการแก้ backend หรือ Firestore rules ใน PR นั้น การเปิด Google Sign-in การอนุญาตโดเมน preview และการให้สิทธิ์แอดมินยังตั้งค่าแยกจาก workflow

หาก Firebase CLI แจ้งว่ายังไม่มีนโยบายล้างอิมเมจของ Cloud Functions ให้ผู้ดูแลตั้งนโยบายครั้งเดียวด้วย `firebase functions:artifacts:setpolicy --project uplang-98cca --location asia-southeast1`

## กติกา

- แต่ละข้อมีประโยคตัวอย่างภาษาอังกฤษและคำแปลภาษาไทย 8 ตัวเลือก ช้อยส์ใช้คำแปลสั้นและไม่ซ้ำกันในข้อเดียว ส่วนคำอธิบายเต็มจะแสดงหลังตอบ รายการที่ตอบถูกจะออกจากการสุ่มจนเริ่มรอบใหม่
- คำที่ตอบผิดจะแสดงเฉลยและกลับเข้าไปในคิวสุ่มหลังทำคำอื่นอีก 3–7 ข้อ เมื่อเหลือเฉพาะคำท้ายรอบ ระบบจะเลือกคำอื่นที่เหลือก่อนเมื่อทำได้
- รอบจบเมื่อตอบถูกครบทั้ง 5,000 รายการ กดเริ่มรอบใหม่ได้โดยยังเก็บสถิติสะสมเดิม
- คำสะกดเหมือนกันที่เป็นคนละรายการในต้นฉบับจะใช้ชนิดคำหรือบริบทแยกกัน จึงนับเป็น 5,000 รายการคำศัพท์ตามความหมาย

## ข้อมูลคำศัพท์

ใช้หัวคำ ชนิดคำ และระดับ CEFR จาก PDF [The Oxford 3000](https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_3000.pdf) และ [The Oxford 5000](https://www.oxfordlearnersdictionaries.com/external/pdf/wordlists/oxford-3000-5000/The_Oxford_5000.pdf) ซึ่งเป็นส่วนเพิ่ม รายการ `an` ถูกนับรวมกับ `a, an` ให้เหลือ 5,000 ข้อ คำถามเลือกคำแปลหนึ่งความหมายต่อรายการ นิยามมาจาก [Princeton WordNet 3.0](https://wordnet.princeton.edu/) และนิยามที่เขียนเพิ่มใน `scripts/definitions.tsv` โปรเจกต์เป็นเครื่องมือฝึกอิสระ

ข้อมูลมีฟิลด์ `meaningTh` สำหรับคำแปล `example` สำหรับประโยคตัวอย่าง และ `exampleTh` สำหรับคำแปลประโยคที่เปิดเผยหลังตอบ คำแปลความหมายเริ่มต้นสร้างด้วย Google Translate ส่วนคำแปลประโยคสร้างด้วยโมเดลอังกฤษ–ไทยของ Argos Translate และมีการแก้ไขบางรายการ จึงยังควรตรวจทานความหมายและความสอดคล้องกับประโยคก่อนใช้เป็นเนื้อหาการสอนอย่างเป็นทางการ ประโยคตัวอย่างมาจาก WordNet 3.0, [English Dictionary](https://github.com/kaysting/english-dictionary) ซึ่งรวบรวมจาก [Free Dictionary API](https://dictionaryapi.dev/) และประโยคที่เขียนเพิ่ม ข้อมูลพร้อมใช้งานในไฟล์ แอปไม่เรียกบริการแปลขณะฝึก ดูรายละเอียดแหล่งข้อมูลและสิทธิ์ใน [functions/data/SOURCES.md](functions/data/SOURCES.md)

`functions/data/oxford.json` พร้อมใช้งานในโปรเจกต์ ถ้าต้องการสร้างไฟล์ใหม่ ให้ส่งข้อความที่แยกจาก PDF ตามลำดับคอลัมน์ให้ `python3 scripts/build-catalog.py oxford3000.txt oxford5000.txt WordNet-3.0/dict` ดูสัญญาอนุญาต WordNet ใน `functions/data/WORDNET-LICENSE.txt`

ฟิลด์ `choiceTh` เก็บคำแปลสั้นสำหรับช้อยส์ แยกจาก `meaningTh` ที่ใช้แสดงความหมายเต็มหลังตอบ หากไม่มี `choiceTh` จะใช้ `meaningTh` โดยรายการปัจจุบันมีคำแปลสำหรับช้อยส์ยาวไม่เกิน 60 ตัวอักษร คำถามเก่าที่มีช้อยส์ซึ่งย่อแล้วซ้ำกันจะยังใช้ความหมายเต็มเฉพาะช้อยส์เหล่านั้น เพื่อไม่ให้กำกวมและยังตอบต่อได้ด้วยความคืบหน้าเดิม

สคริปต์สร้างรายการจะรักษาคำแปล คำแปลสั้น และประโยคตัวอย่างจากไฟล์เดิมตามคำศัพท์ ชนิดคำ และบริบท หากมีรายการใหม่ที่ยังไม่มีข้อมูลส่วนที่จำเป็น สคริปต์จะหยุดแทนการเขียนทับข้อมูลที่พร้อมใช้งาน

## โครงสร้างโปรเจกต์

| ตำแหน่ง | หน้าที่ |
| --- | --- |
| `src/App.jsx`, `src/Login.jsx` | หน้าฝึกคำศัพท์และเข้าสู่ระบบ |
| `src/Stats.jsx`, `src/Admin.jsx` | สถิติรายคำและหน้าผู้ดูแล |
| `src/api.js`, `src/demo.js` | Firebase Auth, API client และโหมดในเครื่อง |
| `src/components/ui/`, `src/index.css` | คอมโพเนนต์ UI และสไตล์ |
| `functions/index.js` | API, การตรวจสิทธิ์ และบันทึกข้อมูลใน Firestore |
| `functions/quiz.js`, `functions/quiz.test.js` | กติกาการสุ่มคำ การตอบ การทบทวน และชุดทดสอบ |
| `functions/data/` | รายการคำศัพท์ แหล่งข้อมูล และสัญญาอนุญาต |
| `scripts/` | สร้างรายการคำศัพท์และจัดการสิทธิ์แอดมิน |
| `firebase.json`, `firestore.rules`, `firestore.indexes.json` | การตั้งค่า deploy, emulator และ Firestore |
| `.github/workflows/` | Deploy จาก `main` และ Hosting Preview สำหรับ PR |
