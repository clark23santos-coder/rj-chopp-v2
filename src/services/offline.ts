import type { AxiosInstance } from 'axios';
import { addAuditLog } from './audit';

export const OFFLINE_QUEUE_KEY = 'rjchopp_offline_queue';
export const OFFLINE_ORDERS_KEY = 'rjchopp_offline_orders';
export const OFFLINE_STATUS_EVENT = 'rjchopp_offline_status_changed';
export const ORDER_META_STORAGE_KEY = 'rjchopp_order_meta';

export type OfflineActionType =
  | 'CREATE_ORDER'
  | 'CREATE_WITHDRAWAL'
  | 'WITHDRAWAL_OK'
  | 'UPDATE_WITHDRAWAL'
  | 'DELETE_WITHDRAWAL';

export type OfflineAction = {
  id: string;
  type: OfflineActionType;
  title: string;
  payload: any;
  createdAt: string;
  syncedAt?: string | null;
  error?: string | null;
};

function readStorage(key: string, fallback: any) {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return fallback;
    }

    return JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(OFFLINE_STATUS_EVENT));
}

export function isOnline() {
  return navigator.onLine;
}

export function getOfflineQueue(): OfflineAction[] {
  const queue = readStorage(OFFLINE_QUEUE_KEY, []);

  return Array.isArray(queue) ? queue : [];
}

export function getPendingOfflineQueue() {
  return getOfflineQueue().filter((item) => !item.syncedAt);
}

export function addOfflineAction(action: {
  type: OfflineActionType;
  title: string;
  payload: any;
}) {
  const queue = getOfflineQueue();

  const newAction: OfflineAction = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: action.type,
    title: action.title,
    payload: action.payload,
    createdAt: new Date().toISOString(),
    syncedAt: null,
    error: null,
  };

  writeStorage(OFFLINE_QUEUE_KEY, [newAction, ...queue]);

  addAuditLog({
    area: 'Sistema',
    action: 'CREATE',
    title: `Ação salva offline: ${action.title}`,
    description: 'Essa ação ficou pendente para sincronizar quando a internet voltar.',
  });

  return newAction;
}

export function getOfflineOrders() {
  const orders = readStorage(OFFLINE_ORDERS_KEY, []);

  return Array.isArray(orders) ? orders : [];
}

export function saveOfflineOrder(order: any) {
  const orders = getOfflineOrders();
  writeStorage(OFFLINE_ORDERS_KEY, [order, ...orders]);
}

export function removeOfflineOrder(tempId: string) {
  const orders = getOfflineOrders().filter((order: any) => order.id !== tempId);
  writeStorage(OFFLINE_ORDERS_KEY, orders);
}

export function replaceTempOrderMeta(tempId: string, realId: string, metaData: any) {
  const meta = readStorage(ORDER_META_STORAGE_KEY, {});
  const currentTempMeta = meta[tempId] || {};

  delete meta[tempId];

  meta[realId] = {
    ...currentTempMeta,
    ...metaData,
  };

  writeStorage(ORDER_META_STORAGE_KEY, meta);
}

function updateQueueItem(actionId: string, data: Partial<OfflineAction>) {
  const queue = getOfflineQueue().map((item) =>
    item.id === actionId
      ? {
          ...item,
          ...data,
        }
      : item
  );

  writeStorage(OFFLINE_QUEUE_KEY, queue);
}

export function clearSyncedOfflineActions() {
  const pending = getOfflineQueue().filter((item) => !item.syncedAt);
  writeStorage(OFFLINE_QUEUE_KEY, pending);
}

async function syncCreateOrder(api: AxiosInstance, action: OfflineAction) {
  const response = await api.post(
    '/orders',
    action.payload.data,
    action.payload.config || {}
  );

  const realOrderId = response.data?.id;
  const tempOrderId = action.payload.tempOrderId;

  if (realOrderId && tempOrderId) {
    replaceTempOrderMeta(tempOrderId, realOrderId, action.payload.meta || {});
    removeOfflineOrder(tempOrderId);
  }

  return response.data;
}

async function syncLocalOnlyAction(action: OfflineAction) {
  return {
    ok: true,
    localOnly: true,
    actionId: action.id,
  };
}

export async function syncOfflineQueue(api: AxiosInstance) {
  if (!navigator.onLine) {
    return {
      synced: 0,
      failed: getPendingOfflineQueue().length,
    };
  }

  const pending = getPendingOfflineQueue().reverse();

  let synced = 0;
  let failed = 0;

  for (const action of pending) {
    try {
      if (action.type === 'CREATE_ORDER') {
        await syncCreateOrder(api, action);
      } else {
        await syncLocalOnlyAction(action);
      }

      updateQueueItem(action.id, {
        syncedAt: new Date().toISOString(),
        error: null,
      });

      synced += 1;

      addAuditLog({
        area: 'Sistema',
        action: 'UPDATE',
        title: `Sincronizado: ${action.title}`,
        description: 'A ação pendente offline foi sincronizada com sucesso.',
      });
    } catch (error: any) {
      failed += 1;

      updateQueueItem(action.id, {
        error:
          error?.response?.data?.error ||
          error?.message ||
          'Erro ao sincronizar',
      });
    }
  }

  window.dispatchEvent(new Event(OFFLINE_STATUS_EVENT));

  return {
    synced,
    failed,
  };
}
