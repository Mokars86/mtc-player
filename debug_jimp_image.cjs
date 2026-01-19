const { Jimp } = require('jimp');
const path = require('path');

async function test() {
    try {
        const sourcePath = path.join(__dirname, 'resources', 'icon.png');
        console.log('Reading:', sourcePath);
        const image = await Jimp.read(sourcePath);
        console.log('Image read successfully');
        console.log('Image keys:', Object.keys(image));
        console.log('Image prototype keys:', Object.keys(Object.getPrototypeOf(image)));

        console.log('Has clone:', typeof image.clone);
        console.log('Has resize:', typeof image.resize);
        console.log('Has writeAsync:', typeof image.writeAsync);
        console.log('Has write:', typeof image.write);

        try {
            const cloned = image.clone();
            console.log('Cloned successfully');
            cloned.resize(100, 100);
            console.log('Resized successfully');
            await cloned.write('test_output.png'); // Try write instead of writeAsync
            console.log('Written successfully with .write()');
        } catch (err) {
            console.error('Operation failed:', err);
        }

    } catch (err) {
        console.error('Read failed:', err);
    }
}

test();
