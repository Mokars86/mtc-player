# Android Deployment Guide for MTc Player

This guide covers the steps to prepare and deploy your app to the Google Play Store.

## 1. Assets & Policies
All necessary assets and documents have been generated:
- **App Icon**: `resources/icon.png` (High-res source)
- **Splash Screen**: `resources/splash.png` (High-res source)
- **Privacy Policy**: `public/privacy_policy.html`
- **Terms & Conditions**: `public/terms_conditions.html`

## 2. Generating Android Assets
We use `@capacitor/assets` to automatically generate all required icon and splash screen densities.
Run the following command in your project root:
```bash
npx @capacitor/assets generate --android
```

## 3. Signing Your App
You need a release keystore to sign your app. **Keep this file and its password safe.**
Run this command to generate a new keystore (if you don't have one):
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```
Follow the prompts to set a password and your details.

## 4. Building the Signed Bundle (AAB)
1. build the web assets:
    ```bash
    npm run build
    npx cap sync android
    ```
2. Open the Android project in Android Studio:
    ```bash
    npx cap open android
    ```
3. In Android Studio:
    - Go to **Build > Generate Signed Bundle / APK**.
    - Select **Android App Bundle**.
    - Click **Next**.
    - Choose the keystore path you created in step 3.
    - Enter the keystore password, key alias, and key password.
    - Click **Next**.
    - Select **release** as the build variant.
    - Click **Finish**.

The `.aab` file will be generated in `android/app/release/`.

## 5. Play Console Upload
1. Create an account on [Google Play Console](https://play.google.com/console).
2. Create a new app.
3. Upload the `.aab` file you generated.
4. Fill in the store listing details (use the generated `icon.png` and `splash.png` for the store graphics).
5. For the Privacy Policy URL, you will need to host the `generated privacy_policy.html` file somewhere (e.g., GitHub Pages, Firebase Hosting, or your own server) and provide that URL.
