const Jimp = require('jimp');
console.log('Jimp export type:', typeof Jimp);
console.log('Jimp keys:', Object.keys(Jimp));
if (typeof Jimp === 'function') console.log('Jimp is function');
try {
    console.log('Jimp.read exists:', typeof Jimp.read);
} catch (e) { console.log(e); }
