import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

// Types
export type TransactionType = 'income' | 'expense';
export type CategoryId =
  | 'gasolina'
  | 'leña'
  | 'otro_ingreso'
  | 'bolo'
  | 'cigarro'
  | 'trago'
  | 'cerveza'
  | 'comida'
  | 'otro_gasto';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: CategoryId;
  categoryName: string;
  amount: number;
  note?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
  paymentMethod?: 'efectivo' | 'qr_transferencia';
}

const CATEGORIES: Record<
  CategoryId,
  { name: string; type: TransactionType; icon: string; iconFamily: 'ion' | 'mat' | 'fa'; color: string; bg: string }
> = {
  gasolina: { name: 'Venta Gasolina', type: 'income', icon: 'gas-station', iconFamily: 'mat', color: '#fbbf24', bg: '#451a03' },
  leña: { name: 'Venta Leña', type: 'income', icon: 'tree', iconFamily: 'fa', color: '#34d399', bg: '#064e3b' },
  otro_ingreso: { name: 'Otro Ingreso', type: 'income', icon: 'add-circle', iconFamily: 'ion', color: '#38bdf8', bg: '#082f49' },
  bolo: { name: 'Bolo / Coca', type: 'expense', icon: 'leaf', iconFamily: 'ion', color: '#a3e635', bg: '#1a2e05' },
  cigarro: { name: 'Cigarro', type: 'expense', icon: 'smoking', iconFamily: 'fa', color: '#e2e8f0', bg: '#334155' },
  trago: { name: 'Trago / Licor', type: 'expense', icon: 'wine', iconFamily: 'ion', color: '#fb7185', bg: '#4c0519' },
  cerveza: { name: 'Cerveza', type: 'expense', icon: 'beer', iconFamily: 'ion', color: '#facc15', bg: '#422006' },
  comida: { name: 'Comida', type: 'expense', icon: 'utensils', iconFamily: 'fa', color: '#fb923c', bg: '#431407' },
  otro_gasto: { name: 'Otro Gasto', type: 'expense', icon: 'bag-handle', iconFamily: 'ion', color: '#c084fc', bg: '#3b0764' },
};

const PRESET_AMOUNTS = [10, 20, 50, 100, 150, 200];
const STORAGE_KEY = '@vicios_transactions_v1';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'pad' | 'reports' | 'settings'>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Pad State
  const [padType, setPadType] = useState<TransactionType>('income');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('gasolina');
  const [amountStr, setAmountStr] = useState<string>('0');
  const [noteStr, setNoteStr] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'qr_transferencia'>('efectivo');

  // Load transactions and request GPS on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setTransactions(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Error loading transactions:', e);
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setCurrentLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      } catch (err) {
        console.log('GPS permission skipped or unavailable');
      }
    })();
  }, []);

  const saveTransactions = async (newTxs: Transaction[]) => {
    setTransactions(newTxs);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newTxs));
    } catch (e) {
      console.warn('Error saving transactions:', e);
    }
  };

  // Pad Actions
  const handleDigitPress = (digit: string) => {
    if (amountStr === '0' && digit !== '.') {
      setAmountStr(digit);
    } else if (digit === '.' && amountStr.includes('.')) {
      return;
    } else if (amountStr.length < 9) {
      setAmountStr(amountStr + digit);
    }
  };

  const handleBackspace = () => {
    if (amountStr.length <= 1) {
      setAmountStr('0');
    } else {
      setAmountStr(amountStr.slice(0, -1));
    }
  };

  const handleClear = () => {
    setAmountStr('0');
    setNoteStr('');
  };

  const handleSaveTransaction = async () => {
    const val = parseFloat(amountStr);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Monto inválido', 'Por favor ingresa un monto mayor a 0');
      return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const newTx: Transaction = {
      id: 'tx_mobile_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: padType,
      category: selectedCategory,
      categoryName: CATEGORIES[selectedCategory]?.name || 'Registro',
      amount: val,
      note: noteStr.trim() || undefined,
      date: dateStr,
      time: timeStr,
      timestamp: Date.now(),
      location: currentLocation,
      paymentMethod,
    };

    const updated = [newTx, ...transactions];
    await saveTransactions(updated);

    Alert.alert('¡Registrado!', `${padType === 'income' ? 'Ingreso' : 'Gasto'} de $${val.toFixed(2)} guardado.`);
    handleClear();
    setCurrentTab('home');
  };

  const handleDeleteTransaction = (id: string) => {
    Alert.alert('Eliminar Registro', '¿Seguro que deseas eliminar este movimiento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          const updated = transactions.filter((t) => t.id !== id);
          saveTransactions(updated);
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert('Borrar Todo', '¿Estás seguro de eliminar todo el historial del celular?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar Todo',
        style: 'destructive',
        onPress: () => saveTransactions([]),
      },
    ]);
  };

  // Calculations for Today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTxs = transactions.filter((t) => t.date === todayStr);

  const todayIncome = todayTxs.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const todayExpense = todayTxs.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const todayNet = todayIncome - todayExpense;

  const gasIncome = todayTxs.filter((t) => t.category === 'gasolina').reduce((acc, t) => acc + t.amount, 0);
  const woodIncome = todayTxs.filter((t) => t.category === 'leña').reduce((acc, t) => acc + t.amount, 0);
  const vicesExpense = todayTxs
    .filter((t) => ['bolo', 'cigarro', 'trago', 'cerveza'].includes(t.category))
    .reduce((acc, t) => acc + t.amount, 0);

  const renderIcon = (catId: CategoryId, size = 22) => {
    const info = CATEGORIES[catId] || CATEGORIES.otro_gasto;
    if (info.iconFamily === 'ion') {
      return <Ionicons name={info.icon as any} size={size} color={info.color} />;
    }
    if (info.iconFamily === 'mat') {
      return <MaterialCommunityIcons name={info.icon as any} size={size} color={info.color} />;
    }
    return <FontAwesome5 name={info.icon as any} size={size} color={info.color} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <MaterialCommunityIcons name="shield-check" size={26} color="#10b981" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.headerTitle}>Gestión de Vicios</Text>
            <Text style={styles.headerSub}>Móvil Nativo • Expo Go</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.headerQuickBtn}
          onPress={() => {
            setPadType('income');
            setSelectedCategory('gasolina');
            setCurrentTab('pad');
          }}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Main Body */}
      <View style={styles.body}>
        {currentTab === 'home' && (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Today Summary Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardHeaderDate}>Hoy: {todayStr}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Resumen</Text>
                </View>
              </View>

              <View style={styles.balanceRow}>
                <View>
                  <Text style={styles.balanceLabel}>Saldo Neto del Día</Text>
                  <Text style={[styles.balanceAmount, { color: todayNet >= 0 ? '#34d399' : '#f87171' }]}>
                    ${todayNet.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Venta Gasolina</Text>
                  <Text style={[styles.statValue, { color: '#fbbf24' }]}>${gasIncome.toFixed(2)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Venta Leña</Text>
                  <Text style={[styles.statValue, { color: '#34d399' }]}>${woodIncome.toFixed(2)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Gasto Vicios</Text>
                  <Text style={[styles.statValue, { color: '#f87171' }]}>${vicesExpense.toFixed(2)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Gastos</Text>
                  <Text style={[styles.statValue, { color: '#fb7185' }]}>${todayExpense.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.bigActionBtn, { backgroundColor: '#064e3b', borderColor: '#059669' }]}
                onPress={() => {
                  setPadType('income');
                  setSelectedCategory('gasolina');
                  setCurrentTab('pad');
                }}
              >
                <MaterialCommunityIcons name="gas-station" size={24} color="#34d399" />
                <Text style={styles.bigActionText}>+ Venta Gasolina</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bigActionBtn, { backgroundColor: '#451a03', borderColor: '#b45309' }]}
                onPress={() => {
                  setPadType('expense');
                  setSelectedCategory('bolo');
                  setCurrentTab('pad');
                }}
              >
                <Ionicons name="leaf" size={22} color="#fbbf24" />
                <Text style={styles.bigActionText}>- Gasto Bolo/Coca</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Transactions List */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Últimos Movimientos</Text>
              <Text style={styles.sectionBadge}>{transactions.length} registros</Text>
            </View>

            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color="#475569" />
                <Text style={styles.emptyText}>No hay registros todavía.</Text>
                <Text style={styles.emptySub}>Presiona el teclado rápido para registrar ventas o gastos.</Text>
              </View>
            ) : (
              transactions.slice(0, 15).map((t) => (
                <View key={t.id} style={styles.txItem}>
                  <View style={[styles.txIconBox, { backgroundColor: CATEGORIES[t.category]?.bg || '#1e293b' }]}>
                    {renderIcon(t.category)}
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle}>{t.categoryName}</Text>
                    <Text style={styles.txTime}>
                      {t.date} • {t.time} {t.note ? `• ${t.note}` : ''}
                    </Text>
                  </View>
                  <View style={styles.txAmountCol}>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: t.type === 'income' ? '#34d399' : '#f87171' },
                      ]}
                    >
                      {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteTransaction(t.id)}>
                      <Ionicons name="trash-outline" size={16} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}

        {/* TAB 2: QUICK ENTRY PAD */}
        {currentTab === 'pad' && (
          <View style={styles.padContainer}>
            {/* Type selector */}
            <View style={styles.padTypeRow}>
              <TouchableOpacity
                style={[styles.padTypeBtn, padType === 'income' && styles.padTypeBtnActiveIncome]}
                onPress={() => {
                  setPadType('income');
                  setSelectedCategory('gasolina');
                }}
              >
                <Text style={[styles.padTypeText, padType === 'income' && styles.padTypeTextActive]}>
                  + Ingreso (Ventas)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.padTypeBtn, padType === 'expense' && styles.padTypeBtnActiveExpense]}
                onPress={() => {
                  setPadType('expense');
                  setSelectedCategory('bolo');
                }}
              >
                <Text style={[styles.padTypeText, padType === 'expense' && styles.padTypeTextActive]}>
                  - Gasto (Vicios/Otros)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category horizontal pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {(Object.keys(CATEGORIES) as CategoryId[])
                .filter((cat) => CATEGORIES[cat].type === padType)
                .map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catPill,
                      selectedCategory === cat && {
                        borderColor: CATEGORIES[cat].color,
                        backgroundColor: CATEGORIES[cat].bg,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    {renderIcon(cat, 18)}
                    <Text
                      style={[
                        styles.catPillText,
                        selectedCategory === cat && { color: CATEGORIES[cat].color, fontWeight: '700' },
                      ]}
                    >
                      {CATEGORIES[cat].name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Display screen */}
            <View style={styles.displayBox}>
              <Text style={styles.displayCurrency}>$</Text>
              <Text style={styles.displayAmount}>{amountStr}</Text>
            </View>

            {/* Quick preset amount pills */}
            <View style={styles.presetRow}>
              {PRESET_AMOUNTS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.presetPill}
                  onPress={() => setAmountStr(p.toString())}
                >
                  <Text style={styles.presetText}>+${p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Keypad Grid */}
            <View style={styles.keypad}>
              {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['.', '0', '⌫'],
              ].map((row, rIdx) => (
                <View key={rIdx} style={styles.keyRow}>
                  {row.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.keyBtn}
                      onPress={() => {
                        if (item === '⌫') handleBackspace();
                        else handleDigitPress(item);
                      }}
                    >
                      <Text style={styles.keyText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveTransaction}>
              <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
              <Text style={styles.submitBtnText}>REGISTRAR EN CELULAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 3: REPORTS */}
        {currentTab === 'reports' && (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Balance Total Acumulado</Text>
              <Text style={styles.reportTotalNet}>
                ${(
                  transactions.filter((t) => t.type === 'income').reduce((a, b) => a + b.amount, 0) -
                  transactions.filter((t) => t.type === 'expense').reduce((a, b) => a + b.amount, 0)
                ).toFixed(2)}
              </Text>

              <View style={styles.reportRow}>
                <Text style={styles.reportRowLabel}>Total Ingresos Ingresados:</Text>
                <Text style={{ color: '#34d399', fontWeight: 'bold' }}>
                  +${transactions.filter((t) => t.type === 'income').reduce((a, b) => a + b.amount, 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={styles.reportRowLabel}>Total Gastos Registrados:</Text>
                <Text style={{ color: '#f87171', fontWeight: 'bold' }}>
                  -${transactions.filter((t) => t.type === 'expense').reduce((a, b) => a + b.amount, 0).toFixed(2)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={async () => {
                const text = `📊 Resumen Gestión de Vicios:\nTotal Ingresos: $${transactions
                  .filter((t) => t.type === 'income')
                  .reduce((a, b) => a + b.amount, 0)
                  .toFixed(2)}\nTotal Gastos: $${transactions
                  .filter((t) => t.type === 'expense')
                  .reduce((a, b) => a + b.amount, 0)
                  .toFixed(2)}`;
                await Share.share({ message: text });
              }}
            >
              <Ionicons name="share-social-outline" size={20} color="#ffffff" />
              <Text style={styles.shareBtnText}>Compartir Reporte por WhatsApp</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* TAB 4: SETTINGS */}
        {currentTab === 'settings' && (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Información de la App</Text>
              <Text style={styles.settingsDesc}>
                Esta es la versión nativa compilada para Expo Go y React Native. Permite control de ventas y gastos sin conexión, registro rápido y geolocalización.
              </Text>
            </View>

            <TouchableOpacity style={styles.dangerBtn} onPress={handleClearAll}>
              <Ionicons name="trash" size={20} color="#f87171" />
              <Text style={styles.dangerBtnText}>Borrar Todos los Datos Locales</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, currentTab === 'home' && styles.navItemActive]}
          onPress={() => setCurrentTab('home')}
        >
          <Ionicons name="home" size={22} color={currentTab === 'home' ? '#34d399' : '#64748b'} />
          <Text style={[styles.navText, currentTab === 'home' && styles.navTextActive]}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'pad' && styles.navItemActive]}
          onPress={() => setCurrentTab('pad')}
        >
          <Ionicons name="keypad" size={22} color={currentTab === 'pad' ? '#34d399' : '#64748b'} />
          <Text style={[styles.navText, currentTab === 'pad' && styles.navTextActive]}>Teclado</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'reports' && styles.navItemActive]}
          onPress={() => setCurrentTab('reports')}
        >
          <Ionicons name="bar-chart" size={22} color={currentTab === 'reports' ? '#34d399' : '#64748b'} />
          <Text style={[styles.navText, currentTab === 'reports' && styles.navTextActive]}>Reportes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, currentTab === 'settings' && styles.navItemActive]}
          onPress={() => setCurrentTab('settings')}
        >
          <Ionicons name="settings" size={22} color={currentTab === 'settings' ? '#34d399' : '#64748b'} />
          <Text style={[styles.navText, currentTab === 'settings' && styles.navTextActive]}>Ajustes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
  },
  headerSub: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  headerQuickBtn: {
    backgroundColor: '#059669',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  scroll: {
    padding: 16,
  },
  card: {
    backgroundColor: '#131d31',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderDate: {
    color: '#94a3b8',
    fontSize: 13,
  },
  badge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  balanceRow: {
    marginVertical: 6,
  },
  balanceLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0b1120',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  bigActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  bigActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionBadge: {
    color: '#64748b',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#131d31',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  emptyText: {
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySub: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131d31',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: 12,
  },
  txTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  txTime: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  txAmountCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  padContainer: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  padTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  padTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    alignItems: 'center',
  },
  padTypeBtnActiveIncome: {
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  padTypeBtnActiveExpense: {
    backgroundColor: '#4c0519',
    borderWidth: 1,
    borderColor: '#f43f5e',
  },
  padTypeText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  padTypeTextActive: {
    color: '#ffffff',
  },
  catScroll: {
    maxHeight: 45,
    marginVertical: 6,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    marginRight: 8,
    gap: 6,
  },
  catPillText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  displayBox: {
    backgroundColor: '#0b1120',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  displayCurrency: {
    color: '#10b981',
    fontSize: 26,
    fontWeight: '800',
    marginRight: 6,
  },
  displayAmount: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '900',
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  presetPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  keypad: {
    gap: 6,
  },
  keyRow: {
    flexDirection: 'row',
    gap: 6,
  },
  keyBtn: {
    flex: 1,
    backgroundColor: '#131d31',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  keyText: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    paddingBottom: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {},
  navText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  navTextActive: {
    color: '#34d399',
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  reportTotalNet: {
    color: '#34d399',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 12,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  reportRowLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  shareBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  settingsDesc: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  dangerBtnText: {
    color: '#f87171',
    fontWeight: '700',
    fontSize: 13,
  },
});
