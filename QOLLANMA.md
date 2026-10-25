# RCandy — foydalanish qo'llanmasi

RCandy ikki qismdan iborat:

- **Admin sayt.** Ofisda ishlatiladi: tovarlar, ombor, liniyalar, do'konlar, buyurtmalar, kassa va hisobotlar.
- **Mobil ilova (APK).** Bitta ilova ikki xil ishlaydi: **agent** (buyurtma oladi) va **yetkazuvchi** (yuk tarqatadi, pul oladi).

Sayt uch tilda ishlaydi: o'zbekcha (lotin va kirill) va ruscha. Tilni **Sozlamalar**da almashtirasiz.

## 1. Kirish va xavfsizlik

- Saytga admin login va paroli bilan kiriladi. Parolni hech kimga bermang.
- Tovar qo'shish, tahrirlash, o'chirish va qoldiqni qo'lda o'zgartirish **har safar admin parolini so'raydi**.
- Parolni almashtirish: **Sozlamalar → Xavfsizlik**. Parol unutilsa, serverda `admin-tool.cjs set-admin` buyrug'i bilan yangisi qo'yiladi ([DEPLOY.md](DEPLOY.md), 3-bo'lim).
- Ketma-ket 10 marta noto'g'ri parol kiritilsa, o'sha qurilmadan kirish 10 daqiqaga bloklanadi.

## 2. Boshlang'ich sozlash

1. **Sozlamalar**: kompaniya nomi, manzil va telefon (yuk xatida chiqadi), kredit limiti va qarz muddati (kun).
2. **Tovarlar → Tovar qo'shish**: nomi, kategoriya, narxlar (dona, blok, korobka, kg), blok va korobkadagi soni.
3. **Tovarlar → Kirim**: omborga kelgan tovarni kiriting. Qoldiq shunda paydo bo'ladi. Agent ombordagidan ko'p sota olmaydi.
4. Kerak bo'lsa **narx ro'yxatlari** (ayrim do'konlar uchun alohida narx) va **aksiyalar** (foizli chegirma, muddat va liniyalar bo'yicha).

## 3. Liniyalar va QR kodlar

- Har bir liniyada marshrut kunlari bor. Masalan 4-3-1 — 4-3 liniyasining dushanba marshruti.
- **Liniyalar → liniya → QR**: ikkita QR kod bor:
  - **Agent QR** — telefonni shu liniyaning agenti sifatida ulaydi;
  - **Yetkazuvchi QR** — shu liniyaning yetkazuvchisi sifatida ulaydi.
- QR kod yo'qolsa yoki xodim ishdan ketsa, **"Yangi kalit"** tugmasini bosing. Eski QR bilan kirgan telefonlar darhol chiqarib yuboriladi, yangi QR chop etiladi.

## 4. Agent (mobil ilova)

1. APK'ni o'rnatib, liniyaning **agent QR** kodini skanerlang.
2. **Ish kunini boshlash** — kun boshlanganda bosiladi (vaqt va joy yoziladi).
3. Bugungi marshrut do'konlari chiqadi. Do'konni tanlab, katalogdan tovar qo'shing.
4. To'lov turi: **naqd**, **nasiya** yoki boshqa. Kredit limiti oshgan yoki qarzi muddatidan o'tgan do'konga nasiya berilmaydi.
5. Yetkazish sanasini tanlang va buyurtmani yuboring. Internet bo'lmasa, buyurtma telefonda saqlanadi va internet chiqqanda o'zi yuboriladi.
6. Yangi do'kon qo'shilsa, u agentning liniyasiga tanlangan kun bo'yicha avtomatik qo'shiladi.

## 5. Yetkazuvchi (mobil ilova)

1. Liniyaning **yetkazuvchi QR** kodini skanerlang.
2. **Yetkazish**: kun bo'yicha buyurtmalar ro'yxati. Har birida "Yetkazildi", vozvrat va naqd pul.
3. **Yuk**: omborda nima yuklash kerakligi.
4. **Qarzdorlar**: liniyaning qarzdor do'konlari. Do'konni bosib **PKO** (qarz to'lovi) olinadi. PKO qarzdan ko'p bo'lmaydi.
5. **PKO**: bugungi to'lovlar va **qo'ldagi naqd pul**: yetkazishdan + PKO dan − ofisga topshirilgan.
6. Internet bo'lmasa ham ishlaydi. Amallar navbatda turadi va keyin yuboriladi.

## 6. Ofisda kundalik ish

- **Asosiy**: bugungi buyurtmalar. Belgilab **"Yuk xatlarini chop etish"** — bir A4 varaqqa 3 tagacha yuk xati, marshrut tartibida.
- **Hisobotlar → Yuk varaqasi**: liniya bo'yicha nimani yuklash kerak.
- **Hisobotlar → Kassa**: yetkazuvchi topshirgan pulni **"Qabul qilish"** bilan yozing.
- **Mijozlar**: do'kon qarzi, to'lov qabul qilish, kredit limiti, narx ro'yxati va **akt sverka** (chop etish mumkin).
- **Hisobotlar**: oylik savdo, liniya buyurtmalari, vozvratlar, ish kunlari va reja.

## 7. Zaxira nusxalar

- Server har soat va har kun o'zi nusxa oladi.
- Haftada bir marta **Sozlamalar → Zaxira nusxani yuklab olish** bilan nusxani flesh yoki bulutga saqlang.
- Tiklash tartibi [DEPLOY.md](DEPLOY.md) ning 8-bo'limida.

## 8. Muammo bo'lsa

| Belgi | Sabab va yechim |
|---|---|
| Telefon "Kalit noto'g'ri yoki eskirgan" deydi | QR kodi yangilangan. Saytdan yangi QR chop etib, skanerlang. |
| Telefon "Serverga ulanib bo'lmadi" deydi | Internetni tekshiring. Server ishlayotganini saytni ochib tekshiring. |
| "Server qabul qilmadi" xabari | Masalan, buyurtma ofisda bekor qilingan. Telefondagi ma'lumot serverdagiga moslab yangilandi. |
| Agentda tovar yo'q | Saytda tovar va kirim kiritilganini tekshiring. Telefonda ro'yxatni pastga tortib yangilang. |
| "Yuborilmagan ma'lumotlar" deb chiqishni so'raydi | Internetga ulanib kuting, hammasi yuborilgandan keyin chiqing. |
