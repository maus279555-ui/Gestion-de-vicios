# Gestión de Vicios - Aplicación Móvil Nativa (Expo Go)

Esta carpeta contiene la versión nativa para celulares utilizando **Expo Go** y **React Native**.

## 📱 ¿Cómo probarlo inmediatamente en tu Celular con Expo Go?

### Opción 1: En 1 minuto con Expo Snack (Sin instalar nada en la computadora)
1. Descarga la aplicación **Expo Go** en tu celular desde [Google Play (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent) o [App Store (iOS)](https://apps.apple.com/app/expo-go/id982107779).
2. Entra en tu navegador a [https://snack.expo.dev](https://snack.expo.dev).
3. Pega el código de `App.tsx` y agrega en dependencias `@react-native-async-storage/async-storage` y `expo-location`.
4. En la esquina derecha de Snack, haz clic en **Run on Device** y escanea el código QR con la app **Expo Go** de tu celular.
5. ¡Listo! La aplicación correrá directamente en tu celular físico.

---

### Opción 2: Ejecutar en tu computadora local con Expo CLI
1. Abre tu terminal en tu computadora y entra a esta carpeta:
```bash
cd expo-app
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo de Expo:
```bash
npx expo start
```

4. En la terminal aparecerá un código QR grande:
   - En **Android**: Abre la app **Expo Go** y presiona "Scan QR code".
   - En **iOS (iPhone)**: Abre la app de la **Cámara** y enfoca el código QR para abrir con Expo Go.

---

## 📲 Opción 3: Instalar directamente desde la versión Web PWA (Recomendado)
La versión web que estás viendo ya incluye soporte completo **PWA Móvil**:
- Puedes abrir la URL de tu aplicación en el navegador de tu celular (Google Chrome en Android o Safari en iPhone).
- Presiona **"Instalar aplicación"** o en Safari: **Compartir > Añadir a pantalla de inicio**.
- Se instalará un ícono directo en tu teléfono móvil con soporte sin conexión (offline), acceso a GPS y pantalla completa como cualquier app nativa.
