const { Jimp } = require('jimp');
const path = require('path');

async function test() {
    try {
        const sourcePath = path.join(__dirname, 'resources', 'icon.png');
        const image = await Jimp.read(sourcePath);
        console.log('Image read successfully');

        // Test resize(w, h)
        try {
            console.log('Testing resize(100, 100)...');
            const res = image.clone().resize(100, 100);
            console.log('resize(100, 100) returned:', typeof res);
        } catch (e) {
            console.log('resize(100, 100) failed:', e.message);
        }

        // Test resize({ w, h })
        try {
            console.log('Testing resize({ w: 100, h: 100 })...');
            const res = image.clone().resize({ w: 100, h: 100 });
            console.log('resize({ w: 100, h: 100 }) returned:', typeof res);
        } catch (e) {
            console.log('resize({ w: 100, h: 100 }) failed:', e.message);
        }

        // Test write
        try {
            console.log('Testing write("test.png")...');
            const p = image.write('test.png');
            console.log('write("test.png") returned:', p); // Check if promise
            if (p && typeof p.then === 'function') {
                await p;
                console.log('write promise resolved');
            }
        } catch (e) {
            console.log('write("test.png") failed:', e.message);
        }

    } catch (err) {
        console.error('Fatal error:', err);
    }
}

test();
