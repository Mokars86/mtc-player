import os
from PIL import Image

def resize_icons():
    # Source icon path
    source_path = r"C:\Users\RAMLA\.gemini\antigravity\brain\347f346c-ead4-46de-8822-36e9ce7f7260\modern_music_icon_1767180012228.png"
    
    # Destination base path
    android_res_path = r"C:\Users\RAMLA\Downloads\mtc-player\android\app\src\main\res"
    
    # Standard Android Icon Sizes
    sizes = {
        "mipmap-mdpi": (48, 48),
        "mipmap-hdpi": (72, 72),
        "mipmap-xhdpi": (96, 96),
        "mipmap-xxhdpi": (144, 144),
        "mipmap-xxxhdpi": (192, 192)
    }

    if not os.path.exists(source_path):
        print(f"Error: Source file not found at {source_path}")
        return

    try:
        img = Image.open(source_path)
        print(f"Opened source image: {source_path}")

        for folder, size in sizes.items():
            dest_folder = os.path.join(android_res_path, folder)
            os.makedirs(dest_folder, exist_ok=True)
            
            # Resize
            resized_img = img.resize(size, Image.Resampling.LANCZOS)
            
            # Save as ic_launcher.png
            icon_path = os.path.join(dest_folder, "ic_launcher.png")
            resized_img.save(icon_path)
            print(f"Saved {folder}/ic_launcher.png ({size})")
            
            # Save as ic_launcher_round.png (using same image for simplicity, usually masked circle)
            round_icon_path = os.path.join(dest_folder, "ic_launcher_round.png")
            resized_img.save(round_icon_path)
            print(f"Saved {folder}/ic_launcher_round.png ({size})")
            
        print("All icons updated successfully.")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    resize_icons()
