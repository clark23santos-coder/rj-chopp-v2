import { useEffect, useRef, useState } from 'react';
import { RefreshCcw, Wifi, WifiOff } from 'lucide-react';

import { api } from '../services/api';
import {
  OFFLINE_STATUS_EVENT,
  getPendingOfflineQueue,
  syncOfflineQueue,
} from '../services/offline';

export default function OfflineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(getPendingOfflineQueue().length);
  const [syncing, setSyncing] = useState(false);

  const syncingRef = useRef(false);

  function refreshStatus() {
    setOnline(navigator.onLine);
    setPending(getPendingOfflineQueue().length);
  }

  async function runAutoSync(showAlert = false) {
    if (syncingRef.current) {
      return;
    }

    const pendingActions = getPendingOfflineQueue();

    if (!navigator.onLine) {
      refreshStatus();

      if (showAlert) {
        alert('Ainda está sem internet. Quando voltar, o sistema tenta sincronizar sozinho.');
      }

      return;
    }

    if (pendingActions.length === 0) {
      refreshStatus();
      return;
    }

    try {
      syncingRef.current = true;
      setSyncing(true);

      const result = await syncOfflineQueue(api);

      refreshStatus();

      if (showAlert && result.synced > 0 && result.failed === 0) {
        alert('Sincronização concluída com sucesso.');
      }

      if (showAlert && result.failed > 0) {
        alert('Algumas ações não sincronizaram. Tente novamente ou confira o histórico.');
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      refreshStatus();
    }
  }

  function handleManualSync() {
    runAutoSync(true);
  }

  useEffect(() => {
    function onlineHandler() {
      refreshStatus();

      setTimeout(() => {
        runAutoSync(false);
      }, 1500);
    }

    function offlineHandler() {
      refreshStatus();
    }

    function statusChangedHandler() {
      refreshStatus();

      setTimeout(() => {
        runAutoSync(false);
      }, 1000);
    }

    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);
    window.addEventListener(OFFLINE_STATUS_EVENT, statusChangedHandler);

    refreshStatus();

    setTimeout(() => {
      runAutoSync(false);
    }, 2000);

    const interval = window.setInterval(() => {
      runAutoSync(false);
    }, 20000);

    return () => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
      window.removeEventListener(OFFLINE_STATUS_EVENT, statusChangedHandler);
      window.clearInterval(interval);
    };
  }, []);

  if (online && pending === 0 && !syncing) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[440px] z-[9999]">
      <div
        className={`rounded-3xl border p-4 shadow-2xl ${
          online
            ? 'bg-yellow-400 text-black border-yellow-500'
            : 'bg-red-500 text-white border-red-600'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            {online ? (
              <Wifi size={24} className="shrink-0 mt-1" />
            ) : (
              <WifiOff size={24} className="shrink-0 mt-1" />
            )}

            <div>
              <p className="font-black">
                {syncing
                  ? 'Sincronizando...'
                  : online
                  ? 'Sistema online'
                  : 'Modo offline'}
              </p>

              <p className="text-sm font-bold opacity-80">
                {pending > 0
                  ? `${pending} ação(ões) pendente(s). O sistema tenta sincronizar sozinho.`
                  : online
                  ? 'Tudo sincronizado.'
                  : 'Sem internet. As ações serão salvas no aparelho.'}
              </p>
            </div>
          </div>

          {pending > 0 && (
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="bg-black/20 hover:bg-black/30 rounded-2xl px-4 py-3 font-black flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCcw size={18} className={syncing ? 'animate-spin' : ''} />
              Sync
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
