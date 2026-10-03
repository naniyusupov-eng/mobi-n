const os = require('os');
const { printQRCode } = require('../node_modules/expo/node_modules/@expo/cli/build/src/utils/qr.js');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '192.168.1.47';
}

const ip = getLocalIp();
const port = 8081;
const expoUrl = `exp://${ip}:${port}`;

console.log('\n======================================================');
console.log('📱 Expo Metro Bundler QR Kodi');
console.log(`📡 URL: ${expoUrl}`);
console.log('======================================================\n');

try {
  printQRCode(expoUrl).print();
} catch (e) {
  console.error('QR code chiqarishda xatolik:', e.message);
}

console.log('\n💡 Telefoningizdagi Expo Go ilovasi orqali yuqoridagi QR kodni skanerlang.');
console.log(`🔗 Yoki to'g'ridan-to'g'ri Expo Go ga kiriting: ${expoUrl}\n`);
