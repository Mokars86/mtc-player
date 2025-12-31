const Jimp = require('jimp');
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
            const destFolder = path.join(androidResPath, folder);
            if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });

            const iconPath = path.join(destFolder, "ic_launcher.png");
            const roundIconPath = path.join(destFolder, "ic_launcher_round.png");

            await image.clone().resize(size, size).writeAsync(iconPath);
            console.log(`Saved ${folder}/ic_launcher.png (${size}x${size})`);

            // For round icon, we can try to apply a circle mask if we want to be fancy, 
            // but just resizing is often enough if the icon is designed well. 
            // However, Android expects round icons to be circular.
            // Jimp has a circle() method.
            await image.clone().resize(size, size).circle().writeAsync(roundIconPath);
            console.log(`Saved ${folder}/ic_launcher_round.png (${size}x${size})`);
        }
        console.log("All icons updated successfully.");
    } catch (error) {
        console.error("An error occurred:", error);
        process.exit(1);
    }
}

resizeIcons();
