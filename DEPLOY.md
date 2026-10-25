# RCandy — serverga joylash (internetda ishlashi uchun)

Hozir server shu kompyuterda (`192.168.1.47`) ishlaydi, shuning uchun faqat ofis Wi‑Fi'da ochiladi.
Agentlar ko'chada mobil internet bilan ishlashi uchun server internetdagi kompyuterga (VPS) joylanadi.
Bitta server ham API'ni, ham admin saytni ko'rsatadi.

Quyida `rcandy.example.uz` o'rniga o'z domeningizni, `USER` o'rniga serverdagi foydalanuvchi nomini yozing.

## 1. Kerak bo'ladigan narsalar

- **VPS**: Ubuntu 22.04/24.04, 1 vCPU, 1–2 GB RAM, 20 GB disk yetarli.
- **Domen yoki subdomen**, masalan `rcandy.example.uz`. U VPS IP manziliga `A` yozuvi bilan ulanadi.
  HTTPS uchun domen shart: APK oddiy `http` serverga ulanmaydi.

## 2. Serverga o'rnatish

```bash
# Node.js 24, nginx, git
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git

# Loyiha
sudo mkdir -p /opt/rcandy && sudo chown $USER /opt/rcandy
git clone https://github.com/naniyusupov-eng/mobi-n.git /opt/rcandy
cd /opt/rcandy/web && npm ci && npm run build      # sayt: web/dist

# Faqat SSH va nginx ochiq; server porti 3000 tashqariga ochilmaydi
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw --force enable
```

## 3. Ma'lumotlar, admin paroli va liniya kalitlari

Haqiqiy ma'lumotlar (liniyalar, do'konlar, keyinchalik buyurtmalar va qarzlar) GitHub'da **yo'q**. Ular faqat
shu kompyuterdagi `server/data/sync_db.json` faylida turadi. Faylni serverga nusxalang:

```bash
# shu kompyuterdan (Git Bash yoki PowerShell)
scp server/data/sync_db.json USER@SERVER_IP:/tmp/sync_db.json
# serverda
sudo mkdir -p /var/lib/rcandy && sudo mv /tmp/sync_db.json /var/lib/rcandy/ && sudo chown -R $USER /var/lib/rcandy
```

Server **ishga tushirilishidan oldin**, serverning o'zida:

```bash
cd /opt/rcandy/server
# Klient o'z login va parolini tanlaydi (parol ekranda ko'rinmaydi). Eski admin va uning sessiyalari o'chadi.
DATA_DIR=/var/lib/rcandy node admin-tool.cjs set-admin LOGIN
# Barcha liniyalar uchun yangi agent va yetkazuvchi kalitlari (sinovda ishlatilgan kalitlar ishlamay qoladi)
DATA_DIR=/var/lib/rcandy node admin-tool.cjs rotate-keys
```

Admin shu yerda o'rnatilgani uchun saytdagi "birinchi sozlash" sahifasi internetga hech qachon ochiq qolmaydi.
Parol unutilsa ham xuddi shu `set-admin` buyrug'i bilan yangi parol qo'yiladi.

## 4. Serverni doimiy ishga tushirish (systemd)

`/etc/systemd/system/rcandy.service`:

```ini
[Unit]
Description=RCandy server
After=network.target

[Service]
WorkingDirectory=/opt/rcandy/server
ExecStart=/usr/bin/node sync-server.cjs
Environment=PORT=3000
Environment=HOST=127.0.0.1
Environment=DATA_DIR=/var/lib/rcandy
Restart=always
User=USER

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now rcandy
sudo systemctl status rcandy
```

## 5. HTTPS (nginx + Let's Encrypt)

`/etc/nginx/sites-available/rcandy`:

```nginx
server {
    server_name rcandy.example.uz;
    client_max_body_size 10m;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        # Server urinishlar cheklovini har bir foydalanuvchi manzili bo'yicha hisoblaydi.
        # Bu sarlavhaga faqat 127.0.0.1 dan (shu nginx'dan) kelganda ishonadi.
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/rcandy /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d rcandy.example.uz
```

## 6. Birinchi ochish

1. `https://rcandy.example.uz` ni oching va 3-bosqichda tanlangan login hamda parol bilan kiring.
2. **Sozlamalar**: kompaniya nomi, manzil, telefon; kredit limiti va qarz muddati.
3. **Tovarlar**: haqiqiy tovarlarni qo'shing va **kirim** bilan ombor qoldig'ini kiriting (har bir o'zgarish admin parolini so'raydi).
4. **Liniyalar → liniya → QR**: har bir liniya uchun agent va yetkazuvchi QR kodlarini chop eting.
   Shu saytdan chop etilgan QR kodda server manzili bor. Eski yoki sinov QR kodlari ishlamaydi.

## 7. Mobil ilova (APK)

```bash
npm install -g eas-cli
eas login                                   # Expo hisobi (expo.dev, bepul)
eas build -p android --profile preview      # tayyor bo'lganda APK yuklab olish havolasi chiqadi
```

APK'ni agent va yetkazuvchilar telefoniga o'rnating, so'ng liniya QR kodini skanerlang. Ilova server manzilini
QR koddan oladi va eslab qoladi. Shuning uchun APK yig'ishda `EXPO_PUBLIC_API_URL` yozish shart emas, lekin
xohlasangiz `.env` ga quyidagini yozishingiz mumkin:

```
EXPO_PUBLIC_API_URL=https://rcandy.example.uz/api/v1
```

Telefon qaysi rolga ulanishini QR kodning o'zi belgilaydi: agent QR kodi buyurtma olish ilovasini, yetkazuvchi
QR kodi yetkazish ilovasini ochadi.

## 8. Zaxira nusxalar va tiklash

- Server o'zi `DATA_DIR/backups/` ga har soat (oxirgi 48 ta) va har kun (oxirgi 60 ta) nusxa oladi.
- Haftada bir marta **Sozlamalar → Zaxira nusxani yuklab olish** bilan nusxani boshqa joyda ham saqlang.
  Shunda server diski buzilsa ham ma'lumot qoladi.
- **Serverdagi nusxadan tiklash** (`backups/` papkasidan):
  ```bash
  sudo systemctl stop rcandy
  cp /var/lib/rcandy/backups/daily-YYYY-MM-DD.json /var/lib/rcandy/sync_db.json
  sudo systemctl start rcandy
  ```
- **Yuklab olingan nusxadan tiklash**: unda parol va sessiyalar yo'q. Faylni qo'ygandan keyin, **serverni
  ishga tushirishdan oldin** `DATA_DIR=/var/lib/rcandy node admin-tool.cjs set-admin LOGIN` ni bajaring.

## 9. Yangilash (yangi versiya chiqqanda)

```bash
cd /opt/rcandy && git pull
cd web && npm ci && npm run build
sudo systemctl restart rcandy
```

## Sozlamalar (environment)

| O'zgaruvchi | Standart | Ma'nosi |
|---|---|---|
| `PORT` | `3000` | Server porti |
| `HOST` | `0.0.0.0` | Server tinglaydigan manzil (nginx orqasida `127.0.0.1`) |
| `DATA_DIR` | `server/data` | Baza va zaxira nusxalar papkasi |
| `CORS_ORIGIN` | `*` | Boshqa manzildagi sayt API'ga murojaat qilsa |
| `WEB_DIST` | `web/dist` | Yig'ilgan sayt papkasi |
