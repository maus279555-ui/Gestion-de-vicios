/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GeoLocationInfo, Transaction, TransactionType } from './types/finance';
import {
  AppSettings,
  calculateDailySummary,
  generateSampleData,
  getLocalDateString,
  getStoredSettings,
  getStoredTransactions,
  saveSettings,
  saveTransactions,
} from './services/storage';
import {
  getCurrentCachedLocation,
  startLocationWatcher,
  stopLocationWatcher,
} from './services/geolocation';
import {
  checkTursoStatus,
  fetchTursoTransactions,
  saveTursoTransaction,
  updateTursoTransaction,
  deleteTursoTransaction,
  syncAllToTurso,
  TursoStatus,
} from './services/api';
import { MobileHeader } from './components/MobileHeader';
import { ActiveTab, BottomNav } from './components/BottomNav';
import { HomeOverviewView } from './components/HomeOverviewView';
import { QuickEntryPad } from './components/QuickEntryPad';
import { ReportView } from './components/ReportView';
import { HistorySavingsView } from './components/HistorySavingsView';
import { SettingsView } from './components/SettingsView';
import { DrizzleStudioModal } from './components/DrizzleStudioModal';
import { clearAllTursoTransactions } from './services/api';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [padType, setPadType] = useState<TransactionType>('income');
  const [currentLocation, setCurrentLocation] = useState<GeoLocationInfo | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const [tursoStatus, setTursoStatus] = useState<TursoStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showStudioModal, setShowStudioModal] = useState<boolean>(false);

  // Initialize data on mount - clean slate, NO fictitious data
  useEffect(() => {
    // 1. Load local transactions, strictly filtering out any previous sample/fictitious items
    const stored = getStoredTransactions();
    const cleanRealTxs = stored.filter((t) => !t.id.startsWith('samp-'));
    saveTransactions(cleanRealTxs);
    setTransactions(cleanRealTxs);

    // 2. Check Turso DB status and attempt background sync
    checkTursoStatus().then((status) => {
      setTursoStatus(status);
      if (status.connected) {
        // Fetch from Turso
        fetchTursoTransactions().then((serverTxs) => {
          if (serverTxs && serverTxs.length > 0) {
            // Merge with local transactions
            const map = new Map<string, Transaction>();
            cleanRealTxs.forEach((t: Transaction) => map.set(t.id, t));
            serverTxs.forEach((t: Transaction) => map.set(t.id, t));
            const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
            setTransactions(merged);
            saveTransactions(merged);
          } else {
            // First time connecting with empty Turso table: push existing local records
            syncAllToTurso(cleanRealTxs);
          }
        });
      }
    });

    // 3. Start GPS watcher
    setIsLocating(true);
    startLocationWatcher((loc) => {
      setCurrentLocation(loc);
      setIsLocating(false);
    });

    getCurrentCachedLocation().then((loc) => {
      if (loc) setCurrentLocation(loc);
      setIsLocating(false);
    });

    return () => {
      stopLocationWatcher();
    };
  }, []);

  const updateTransactions = (newTxs: Transaction[]) => {
    setTransactions(newTxs);
    saveTransactions(newTxs);
  };

  const handleAddTransaction = async (newTxData: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: Transaction = {
      ...newTxData,
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
    };

    const updated = [newTx, ...transactions];
    updateTransactions(updated);

    // Push to Turso asynchronously
    saveTursoTransaction(newTx);
  };

  const handleUpdateTransaction = async (updatedTx: Transaction) => {
    const updated = transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t));
    updateTransactions(updated);

    // Update in Turso
    updateTursoTransaction(updatedTx);
  };

  const handleDeleteTransaction = async (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    updateTransactions(updated);

    // Delete in Turso
    deleteTursoTransaction(id);
  };

  const handleRestoreTransactions = (restored: Transaction[]) => {
    updateTransactions(restored);
    syncAllToTurso(restored);
  };

  const handleClearAll = async () => {
    updateTransactions([]);
    try {
      await clearAllTursoTransactions();
      const status = await checkTursoStatus();
      setTursoStatus(status);
    } catch (e) {
      console.warn('Cleared local, Turso clear warning:', e);
    }
  };

  const handleLoadDemoData = () => {
    // Left available as voluntary testing in settings, but NOT auto-loaded
    const samples = generateSampleData();
    updateTransactions(samples);
    syncAllToTurso(samples);
  };

  const handleRefreshLocation = useCallback(() => {
    setIsLocating(true);
    getCurrentCachedLocation().then((loc) => {
      if (loc) setCurrentLocation(loc);
      setIsLocating(false);
    });
  }, []);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleSyncTurso = async () => {
    setIsSyncing(true);
    try {
      const status = await checkTursoStatus();
      setTursoStatus(status);
      const count = await syncAllToTurso(transactions);
      alert(`Sincronización completada con Turso. Se procesaron ${count} registros.`);
    } catch (e: any) {
      alert(`Nota de sincronización: ${e?.message || 'Error al conectar'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoToPad = (type?: TransactionType) => {
    if (type) setPadType(type);
    setActiveTab('pad');
  };

  const todayStr = getLocalDateString();
  const todaySummary = calculateDailySummary(todayStr, transactions);
  const todayCount = transactions.filter((t) => t.date === todayStr).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24 selection:bg-emerald-500 selection:text-white">
      {/* Top Header with title Gestión de Vicios and Turso status */}
      <MobileHeader
        currentLocation={currentLocation}
        isLocating={isLocating}
        onRefreshLocation={handleRefreshLocation}
        currency={settings.currency}
        onChangeCurrency={(c) => handleUpdateSettings({ ...settings, currency: c })}
        onLoadDemoData={handleLoadDemoData}
        todaySavings={todaySummary.netSavings}
        hasData={transactions.length > 0}
        onOpenStudio={() => setShowStudioModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto pt-3">
        {activeTab === 'home' && (
          <HomeOverviewView
            transactions={transactions}
            currency={settings.currency}
            tursoStatus={tursoStatus}
            onGoToPad={handleGoToPad}
            onGoToReports={() => setActiveTab('reports')}
            onOpenStudio={() => setShowStudioModal(true)}
          />
        )}

        {activeTab === 'pad' && (
          <QuickEntryPad
            onAddTransaction={handleAddTransaction}
            currency={settings.currency}
            currentLocation={currentLocation}
            defaultType={padType}
          />
        )}

        {activeTab === 'reports' && (
          <ReportView
            transactions={transactions}
            currency={settings.currency}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === 'savings' && (
          <HistorySavingsView
            transactions={transactions}
            currency={settings.currency}
            onRestoreTransactions={handleRestoreTransactions}
            onClearAll={handleClearAll}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onLoadDemoData={handleLoadDemoData}
            tursoStatus={tursoStatus}
            onSyncTurso={handleSyncTurso}
            isSyncing={isSyncing}
          />
        )}
      </main>

      {/* Drizzle Studio Table Inspector Modal */}
      <DrizzleStudioModal
        isOpen={showStudioModal}
        onClose={() => setShowStudioModal(false)}
        transactions={transactions}
        currency={settings.currency}
        onClearAll={handleClearAll}
        onRefresh={() => {
          checkTursoStatus().then(setTursoStatus);
          fetchTursoTransactions().then((serverTxs) => {
            if (serverTxs) updateTransactions(serverTxs);
          });
        }}
      />

      {/* Sticky Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        todayCount={todayCount}
      />
    </div>
  );
}
