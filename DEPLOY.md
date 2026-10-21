# Mobi_R — serverga joylash (internetda ishlashi uchun)

Hozir server shu kompyuterda (`192.168.1.47`) ishlaydi, shuning uchun faqat ofis Wi‑Fi'da ochiladi.
Agentlar ko'chada mobil internet bilan ishlashi uchun server internetdagi kompyuterga (VPS) joylanadi.
Bitta server ham API'ni, ham admin saytni ko'rsatadi.

## 1. Kerak bo'ladigan narsalar

- **VPS**: Ubuntu 22.04/24.04, 1 vCPU, 1–2 GB RAM, 20 GB disk yetarli.
- **Domen yoki subdomen**, masalan `mobir.example.uz` — VPS IP manziliga `A` yozuvi bilan ulanadi.
  (HTTPS uchun domen kerak; HTTPS'siz telefon va brauzer ma'lumotni ochiq uzatadi.)

## 2. Serverga o'rnatish

```bash
# Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git

# Loyiha
sudo mkdir -p /opt/mobir && sudo chown $USER /opt/mobir
git clone https://github.com/naniyusupov-eng/mobi-n.git /opt/mobir
cd /opt/mobir/web && npm ci && npm run build      # sayt: web/dist
```

### Ma'lumotlarni ko'chirish

Haqiqiy ma'lumotlar (do'konlar, buyurtmalar, qarzlar) GitHub'da **yo'q** — ular faqat
shu kompyuterdagi `server/data/sync_db.json` faylida. Uni serverga xavfsiz nusxalang:

```bash
# shu kompyuterdan (Git Bash yoki PowerShell)
scp server/data/sync_db.json USER@SERVER_IP:/tmp/sync_db.json
# serverda
sudo mkdir -p /var/lib/mobir && sudo mv /tmp/sync_db.json /var/lib/mobir/ && sudo chown -R $USER /var/lib/mobir
```

## 3. Serverni doimiy ishga tushirish (systemd)

`/etc/systemd/system/mobir.service`:

```ini
[Unit]
Description=Mobi_R server
After=network.target

[Service]
WorkingDirectory=/opt/mobir/server
ExecStart=/usr/bin/node sync-server.cjs
Environment=PORT=3000
Environment=HOST=127.0.0.1
Environment=DATA_DIR=/var/lib/mobir
Restart=always
User=YOUR_USER

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now mobir
sudo systemctl status mobir
```

## 4. HTTPS (nginx + Let's Encrypt)

`/etc/nginx/sites-available/mobir`:

```nginx
server {
    server_name mobir.example.uz;
    client_max_body_size 10m;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mobir /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d mobir.example.uz
```

## 5. Birinchi ochish

1. `https://mobir.example.uz` ni oching — **administrator login va parolini o'zingiz tanlaysiz**.
2. Liniyalar → liniya → **QR**: agent va yetkazuvchi kodlarini qayta chop eting
   (eski QR kodlar endi ishlamaydi — ularda maxfiy kalit yo'q edi).

## 6. Mobil ilova

Ilova qaysi serverga ulanishini `EXPO_PUBLIC_API_URL` belgilaydi (`.env` faylida):

```
EXPO_PUBLIC_API_URL=https://mobir.example.uz/api/v1
```

Keyin APK yig'iladi (EAS Build) va agentlar telefoniga o'rnatiladi.

## 7. Zaxira nusxalar

- Server o'zi `DATA_DIR/backups/` ga har soat (oxirgi 48 ta) va har kun (oxirgi 60 ta) nusxa oladi.
- Haftada bir marta Sozlamalar → **Zaxira nusxani yuklab olish** bilan nusxani boshqa joyda ham saqlang
  (server diski buzilsa ham ma'lumot qoladi).
- Tiklash: serverni to'xtating, kerakli nusxani `DATA_DIR/sync_db.json` o'rniga qo'ying, qayta ishga tushiring.
  (Yuklab olingan nusxada parol va sessiyalar yo'q — tiklagandan keyin admin parolini qayta o'rnatasiz.)

## Sozlamalar (environment)

| O'zgaruvchi | Standart | Ma'nosi |
|---|---|---|
| `PORT` | `3000` | Server porti |
| `HOST` | `0.0.0.0` | Qaysi manzilda tinglaydi (nginx orqasida `127.0.0.1`) |
| `DATA_DIR` | `server/data` | Baza va zaxira nusxalar papkasi |
| `CORS_ORIGIN` | `*` | Boshqa manzildagi sayt API'ga murojaat qilsa |
| `WEB_DIST` | `web/dist` | Yig'ilgan sayt papkasi |
