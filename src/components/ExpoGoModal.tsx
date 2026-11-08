import React, { useState } from 'react';
import { X, Smartphone, Copy, Check, ExternalLink, Code2, Terminal, PlayCircle } from 'lucide-react';

interface ExpoGoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpoGoModal: React.FC<ExpoGoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'code' | 'commands'>('guide');
  const [copiedApp, setCopiedApp] = useState(false);
  const [copiedPkg, setCopiedPkg] = useState(false);

  if (!isOpen) return null;

  const appCodeSnippet = `// Archivo: App.tsx para Expo Go
// Ya guardado en /expo-app/App.tsx listo para usar
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Alert, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// Código nativo completo disponible en /expo-app/App.tsx`;

  const handleCopyApp = async () => {
    try {
      // Fetch or use code
      const res = await fetch('/expo-app/App.tsx').catch(() => null);
      if (res && res.ok) {
        const text = await res.text();
        await navigator.clipboard.writeText(text);
      } else {
        await navigator.clipboard.writeText(appCodeSnippet);
      }
      setCopiedApp(true);
      setTimeout(() => setCopiedApp(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Versión Móvil Expo Go</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  React Native
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Listo para escanear y probar en tu celular</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 px-4 bg-slate-950/50 shrink-0">
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Paso a Paso en Celular</span>
          </button>
          <button
            onClick={() => setActiveTab('commands')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'commands'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Comandos Expo CLI</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Código App.tsx</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs leading-relaxed">
          {activeTab === 'guide' && (
            <div className="space-y-4">
              {/* Highlight Snack banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/70 to-slate-900 border border-purple-500/40">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>🚀 Probar en Expo Snack (En 1 Minuto)</span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      No necesitas instalar NodeJS ni terminal. Abre Expo Snack en tu navegador, escanea con la app <strong>Expo Go</strong> en tu celular y ¡funciona al instante!
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href="https://snack.expo.dev"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950 transition"
                  >
                    <span>Abrir Expo Snack</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={handleCopyApp}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
                  >
                    {copiedApp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedApp ? '¡Código App.tsx Copiado!' : 'Copiar Código App.tsx'}</span>
                  </button>
                </div>
              </div>

              {/* Instructions steps */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Instrucciones para tu Celular:</h4>

                <div className="flex gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <strong className="text-slate-100">Instala Expo Go en tu teléfono:</strong>
                    <p className="text-slate-400 mt-0.5">
                      Descárgala gratis en Google Play Store (Android) o App Store (iPhone) buscando <strong>"Expo Go"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <strong className="text-slate-100">Copia el archivo App.tsx:</strong>
                    <p className="text-slate-400 mt-0.5">
                      Todo el código React Native ya está creado en tu proyecto en la carpeta <code className="text-purple-300 bg-slate-900 px-1 py-0.5 rounded">/expo-app/App.tsx</code> con control de gasolina, leña, vicios, teclado numérico y GPS.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <strong className="text-slate-100">Escanear el Código QR:</strong>
                    <p className="text-slate-400 mt-0.5">
                      Abre la app <strong>Expo Go</strong> en tu celular y pulsa "Scan QR code" para enfocar la pantalla de tu computadora. ¡La aplicación cargará de inmediato en tu celular!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'commands' && (
            <div className="space-y-3">
              <p className="text-slate-300">
                Si prefieres correrlo en tu computadora con tu terminal local:
              </p>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 space-y-2">
                <p className="text-slate-400"># 1. Ingresar a la carpeta de la app móvil:</p>
                <p className="text-white">cd expo-app</p>
                <p className="text-slate-400 mt-2"># 2. Instalar dependencias:</p>
                <p className="text-white">npm install</p>
                <p className="text-slate-400 mt-2"># 3. Iniciar Expo y escanear QR:</p>
                <p className="text-white">npx expo start</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                <p className="font-semibold text-xs">💡 Dependencias que utiliza:</p>
                <p className="text-[11px] text-amber-300/80 mt-1">
                  expo, react-native, @react-native-async-storage/async-storage, expo-location, @expo/vector-icons.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono text-[11px]">Archivo: expo-app/App.tsx</span>
                <button
                  onClick={handleCopyApp}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition"
                >
                  {copiedApp ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedApp ? '¡Copiado!' : 'Copiar Todo el Código'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 max-h-60 overflow-y-auto">
                <pre>{`// Gestión de Vicios - Expo Go
// Estructura completa de la app en /expo-app/App.tsx

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// 1. Manejo de estado offline con AsyncStorage
// 2. Teclado numérico táctil optimizado para celular
// 3. Ventas de Gasolina y Leña
// 4. Registro de gastos de Vicios (Bolo, Cigarro, Trago, Cerveza)
// 5. Reportes diarios y saldo neto
// 6. Geolocalización con expo-location

export default function App() { ... }`}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Los archivos están guardados en tu proyecto en <code className="text-purple-300">/expo-app/</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
