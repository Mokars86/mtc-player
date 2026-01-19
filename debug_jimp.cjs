const Jimp = require('jimp');
console.log('Type of Jimp:', typeof Jimp);
console.log('Jimp keys:', Object.keys(Jimp));
console.log('Jimp.read exists:', !!Jimp.read);
console.log('Jimp.default exists:', !!Jimp.default);
if (Jimp.default) {
    console.log('Jimp.default keys:', Object.keys(Jimp.default));
    console.log('Jimp.default.read exists:', !!Jimp.default.read);
}
