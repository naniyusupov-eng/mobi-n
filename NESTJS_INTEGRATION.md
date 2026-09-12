# Mobi_R: NestJS & Cloudflare Integratsiya Qoʻllanmasi

Ushbu hujjat **Mobi_R** savdo agenti mobil ilovasining **NestJS** backend bilan sinxronizatsiya protokoli va API kontraktlarini belgilaydi.

---

## 1. Cloudflare & Aloqa Sozlamalari

- **Proksi:** Cloudflare orqali SSL/TLS shifrlangan ulanish.
- **Headerlar:**
  - `Authorization: Bearer <agent_jwt_token>`
  - `Content-Type: application/json`
  - `X-Client-Version: 1.0.0`

---

## 2. API Endpoints va DTOlar

### 2.1. Agent QR Avtorizatsiyasi
- **Endpoint:** `POST /api/v1/auth/qr-login`
- **Body:**
  ```json
  {
    "qrCode": "AGENT-QND-101"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "agent": {
      "id": "agent_101",
      "code": "AGENT-QND-101",
      "name": "Alisher Vohidov",
      "phone": "+998 90 900 11 22",
      "territory": "Chilonzor & Uchtepa"
    }
  }
  ```

---

### 2.2. Oflayn Buyurtmalarni Sinxronlash (Push Sync)
- **Endpoint:** `POST /api/v1/orders/sync`
- **Body:**
  ```json
  {
    "id": "ord_1726071234_123",
    "shopId": "shop_1",
    "shopName": "Oqtepa Minimarket",
    "agentId": "agent_101",
    "agentName": "Alisher Vohidov",
    "totalAmount": 420000,
    "discountAmount": 21000,
    "finalAmount": 399000,
    "paymentMethod": "naqd", // "naqd" | "nasiya" | "otkazma"
    "status": "confirmed",
    "latitude": 41.2858,
    "longitude": 69.2045,
    "notes": "Ertaga soat 11:00 gacha yetkazilsin",
    "createdAt": "2026-09-11T16:15:00.000Z",
    "items": [
      {
        "productId": "prod_1",
        "productName": "Shokoladli Vafli 200g",
        "unit": "blok",
        "quantity": 3,
        "unitPrice": 110000,
        "totalPrice": 330000
      }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "status": "ok",
    "serverOrderId": "srv_ord_99812",
    "syncedAt": "2026-09-11T16:15:05.000Z"
  }
  ```

---

### 2.3. Yangi Doʻkonlarni Sinxronlash
- **Endpoint:** `POST /api/v1/shops/sync`
- **Body:**
  ```json
  {
    "id": "shop_1726071234_456",
    "name": "Yangi Baraka Market",
    "ownerName": "Sobir aka",
    "phone": "+998 90 999 88 77",
    "address": "Chilonzor 19, 5-uy",
    "latitude": 41.2812,
    "longitude": 69.1994,
    "debtBalance": 0,
    "visitDay": "Dushanba"
  }
  ```

---

## 3. APK Yaratish (Build APK)

Mobil ilovadan toʻgʻridan-toʻgʻri Android qurilmalarga oʻrnatiladigan `.apk` faylini chiqarish uchun quyidagi buyruqlardan foydalaniladi:

### 1-usul: EAS Cloud Build (Eng qulay va tezkor)
```bash
npx eas-cli login
npx eas-cli build -p android --profile preview
```
Bu buyruq natijasida Expo bulutida toʻliq tayyor `.apk` fayl linki taqdim etiladi.

### 2-usul: Mahalliy Android Studio / Gradle orqali
```bash
npm run prebuild:android
cd android
./gradlew assembleRelease
```
Tayyor APK fayl manzili:
`android/app/build/outputs/apk/release/app-release.apk`
