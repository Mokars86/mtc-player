const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function resizeIcons() {
    // Use raw strings or double backslashes for paths
    const sourcePath = path.join(__dirname, 'resources', 'icon.png');
    const androidResPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
    const pwaIconPath = path.join(__dirname, 'public', 'pwa-icon.png');

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

            // Standard Icon
            let img = image.clone();
            img = await img.resize({ w: size, h: size });
            await img.write(iconPath);
            console.log(`Saved ${folder}/ic_launcher.png (${size}x${size})`);

            // Round Icon (Skipping circle crop as method is unavailable, using square for now)
            let imgRound = image.clone();
            imgRound = await imgRound.resize({ w: size, h: size });
            await imgRound.write(roundIconPath);
            console.log(`Saved ${folder}/ic_launcher_round.png (${size}x${size})`);
        }

        // Generate PWA Icon
        let pwaImg = image.clone();
        pwaImg = await pwaImg.resize({ w: 512, h: 512 });
        await pwaImg.write(pwaIconPath);
        console.log(`Saved public/pwa-icon.png (512x512)`);
        console.log("All icons updated successfully.");
    } catch (error) {
        console.error("An error occurred:", error);
        process.exit(1);
    }
}

resizeIcons();
