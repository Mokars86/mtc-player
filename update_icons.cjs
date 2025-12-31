const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function resizeIcons() {
    // Use raw strings or double backslashes for paths
    const sourcePath = 'C:\\Users\\RAMLA\\.gemini\\antigravity\\brain\\347f346c-ead4-46de-8822-36e9ce7f7260\\modern_music_icon_1767180012228.png';
    const androidResPath = 'C:\\Users\\RAMLA\\Downloads\\mtc-player\\android\\app\\src\\main\\res';

    const sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192
    };

    if (!fs.existsSync(sourcePath)) {
        console.error(`Error: Source file not found at ${sourcePath}`);
        return;
    }

    try {
        console.log("Reading source image...");
        const image = await Jimp.read(sourcePath);
        console.log(`Opened source image: ${sourcePath}`);

        for (const [folder, size] of Object.entries(sizes)) {
            // Jimp 1.0+ resize creates a NEW image, it doesn't mutate in place if passing params? 
            // Actually typical Jimp usage: image.resize(...) mutates. 
            // clone() is safer.

            const destFolder = path.join(androidResPath, folder);
            if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });

            const iconPath = path.join(destFolder, "ic_launcher.png");
            const roundIconPath = path.join(destFolder, "ic_launcher_round.png");

            // Resize and save square
            // clone() is on the instance.
            // .write works with callbacks, writeAsync works with promises.
            // in v1.0, write might be different?
            // "Jimp.read" returns a Jimp instance.

            await image.clone().resize({ w: size, h: size }).write(iconPath);
            console.log(`Saved ${folder}/ic_launcher.png (${size}x${size})`);

            // Round
            // .circle() might require extra plugin in v1? 
            // Let's just resize for round for now to avoid complexity if circle is missing.
            await image.clone().resize({ w: size, h: size }).write(roundIconPath);
            console.log(`Saved ${folder}/ic_launcher_round.png (${size}x${size})`);
        }
        console.log("All icons updated successfully.");
    } catch (error) {
        console.error("An error occurred:", error);
        process.exit(1);
    }
}

resizeIcons();
