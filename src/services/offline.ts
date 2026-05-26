import type { AxiosInstance } from 'axios';
import { addAuditLog } from './audit';

export const OFFLINE_QUEUE_KEY = 'rjchopp_offline_queue';
export const OFFLINE_ORDERS_KEY = 'rjchopp_offline_orders';
export const OFFLINE_PRODUCTS_KEY = 'rjchopp_offline_products';
export const OFFLINE_CLIENTS_KEY = 'rjchopp_offline_clients';
export const OFFLINE_FINANCIAL_KEY = 'rjchopp_offline_financial';
export const OFFLINE_STATUS_EVENT = 'rjchopp_offline_status_changed';
export const CACHE_ORDERS_KEY = 'rjchopp_cache_orders';
export const CACHE_PRODUCTS_KEY = 'rjchopp_cache_products';
export const CACHE_CLIENTS_KEY = 'rjchopp_cache_clients';
export const CACHE_FINANCIAL_KEY = 'rjchopp_cache_financial';
export const ORDER_META_STORAGE_KEY = 'rjchopp_order_meta';

export type OfflineActionType =
  | 'CREATE_ORDER' | 'UPDATE_ORDER' | 'DELETE_ORDER'
  | 'CREATE_PRODUCT' | 'UPDATE_PRODUCT' | 'DELETE_PRODUCT'
  | 'CREATE_CLIENT' | 'UPDATE_CLIENT' | 'DELETE_CLIENT'
  | 'CREATE_FINANCIAL' | 'DELETE_FINANCIAL' | 'RECEIVE_PAYMENT'
  | 'CREATE_WITHDRAWAL' | 'WITHDRAWAL_OK' | 'UPDATE_WITHDRAWAL' | 'DELETE_WITHDRAWAL';

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
    if (!saved) return fallback;
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: any) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(OFFLINE_STATUS_EVENT));
}

function asArray(value: any) {
  return Array.isArray(value) ? value : [];
}

function mergeById(offlineItems: any[], onlineItems: any[]) {
  const deletedIds = new Set(
    offlineItems.filter((item) => item.offlineDeleted).map((item) => item.id)
  );

  const map = new Map<string, any>();

  onlineItems
    .filter((item) => !deletedIds.has(item.id))
    .forEach((item) => map.set(String(item.id), item));

  offlineItems.forEach((item) => {
    if (item.offlineDeleted) {
      map.delete(String(item.id));
      return;
    }

    map.set(String(item.id), item);
  });

  return Array.from(map.values());
}

export function isOnline() {
  return navigator.onLine;
}

export function getOfflineQueue(): OfflineAction[] {
  return asArray(readStorage(OFFLINE_QUEUE_KEY, []));
}

export function getPendingOfflineQueue() {
  return getOfflineQueue().filter((item) => !item.syncedAt);
}

export function addOfflineAction(action: { type: OfflineActionType; title: string; payload: any }) {
  const newAction: OfflineAction = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: action.type,
    title: action.title,
    payload: action.payload,
    createdAt: new Date().toISOString(),
    syncedAt: null,
    error: null,
  };

  writeStorage(OFFLINE_QUEUE_KEY, [newAction, ...getOfflineQueue()]);

  addAuditLog({
    area: 'Sistema',
    action: 'CREATE',
    title: `Ação salva offline: ${action.title}`,
    description: 'Essa ação ficou pendente para sincronizar quando a internet voltar.',
  });

  return newAction;
}

export function cacheItems(key: string, items: any[]) {
  writeStorage(key, asArray(items));
}

export function getCachedItems(key: string) {
  return asArray(readStorage(key, []));
}

export function getOfflineItems(key: string) {
  return asArray(readStorage(key, []));
}

export function saveOfflineItem(key: string, item: any) {
  const items = getOfflineItems(key).filter((current) => current.id !== item.id);
  writeStorage(key, [item, ...items]);
}

export function removeOfflineItem(key: string, id: string) {
  writeStorage(key, getOfflineItems(key).filter((item) => item.id !== id));
}

export function markOfflineDeleted(key: string, item: any) {
  saveOfflineItem(key, {
    ...item,
    offlinePending: true,
    offlineDeleted: true,
    offlineAction: 'DELETE',
    deletedAt: new Date().toISOString(),
  });
}

export function mergeOfflineWithOnline(key: string, onlineItems: any[]) {
  return mergeById(getOfflineItems(key), asArray(onlineItems));
}

export function getOfflineOrders() {
  return getOfflineItems(OFFLINE_ORDERS_KEY).filter((item) => !item.offlineDeleted);
}

export function saveOfflineOrder(order: any) {
  saveOfflineItem(OFFLINE_ORDERS_KEY, order);
}

export function updateOfflineOrder(orderId: string, patch: any) {
  const current =
    getOfflineItems(OFFLINE_ORDERS_KEY).find((order) => order.id === orderId) ||
    getCachedItems(CACHE_ORDERS_KEY).find((order) => order.id === orderId);

  if (!current) return;

  saveOfflineOrder({
    ...current,
    ...patch,
    offlinePending: true,
  });
}

export function removeOfflineOrder(tempId: string) {
  removeOfflineItem(OFFLINE_ORDERS_KEY, tempId);
}

export function replaceTempOrderMeta(tempId: string, realId: string, metaData: any) {
  const meta = readStorage(ORDER_META_STORAGE_KEY, {});
  const currentTempMeta = meta[tempId] || {};
  delete meta[tempId];
  meta[realId] = { ...currentTempMeta, ...metaData };
  writeStorage(ORDER_META_STORAGE_KEY, meta);
}

function updateQueueItem(actionId: string, data: Partial<OfflineAction>) {
  writeStorage(
    OFFLINE_QUEUE_KEY,
    getOfflineQueue().map((item) => item.id === actionId ? { ...item, ...data } : item)
  );
}

export function clearSyncedOfflineActions() {
  writeStorage(OFFLINE_QUEUE_KEY, getOfflineQueue().filter((item) => !item.syncedAt));
}

async function syncCreateOrder(api: AxiosInstance, action: OfflineAction) {
  const response = await api.post('/orders', action.payload.data, action.payload.config || {});
  const realOrderId = response.data?.id;
  const tempOrderId = action.payload.tempOrderId;
  if (realOrderId && tempOrderId) {
    replaceTempOrderMeta(tempOrderId, realOrderId, action.payload.meta || {});
    removeOfflineOrder(tempOrderId);
  }
  return response.data;
}

async function syncUpdateOrder(api: AxiosInstance, action: OfflineAction) {
  const response = await api.put(`/orders/${action.payload.id}`, action.payload.data, action.payload.config || {});
  removeOfflineItem(OFFLINE_ORDERS_KEY, action.payload.id);
  return response.data;
}

async function syncDeleteOrder(api: AxiosInstance, action: OfflineAction) {
  const response = await api.delete(`/orders/${action.payload.id}`, action.payload.config || {});
  removeOfflineItem(OFFLINE_ORDERS_KEY, action.payload.id);
  return response.data;
}

async function syncCreateProduct(api: AxiosInstance, action: OfflineAction) {
  const response = await api.post('/products', action.payload.data, action.payload.config || {});
  removeOfflineItem(OFFLINE_PRODUCTS_KEY, action.payload.tempId);
  return response.data;
}
async function syncUpdateProduct(api: AxiosInstance, action: OfflineAction) {
  const response = await api.put(`/products/${action.payload.id}`, action.payload.data, action.payload.config || {});
  removeOfflineItem(OFFLINE_PRODUCTS_KEY, action.payload.id);
  return response.data;
}
async function syncDeleteProduct(api: AxiosInstance, action: OfflineAction) {
  const response = await api.delete(`/products/${action.payload.id}`, action.payload.config || {});
  removeOfflineItem(OFFLINE_PRODUCTS_KEY, action.payload.id);
  return response.data;
}

async function syncCreateClient(api: AxiosInstance, action: OfflineAction) {
  const response = await api.post('/clients', action.payload.data, action.payload.config || {});
  removeOfflineItem(OFFLINE_CLIENTS_KEY, action.payload.tempId);
  return response.data;
}
async function syncUpdateClient(api: AxiosInstance, action: OfflineAction) {
  const response = await api.put(`/clients/${action.payload.id}`, action.payload.data, action.payload.config || {});
  removeOfflineItem(OFFLINE_CLIENTS_KEY, action.payload.id);
  return response.data;
}
async function syncDeleteClient(api: AxiosInstance, action: OfflineAction) {
  const response = await api.delete(`/clients/${action.payload.id}`, action.payload.config || {});
  removeOfflineItem(OFFLINE_CLIENTS_KEY, action.payload.id);
  return response.data;
}

async function syncCreateFinancial(api: AxiosInstance, action: OfflineAction) {
  const response = await api.post('/financial-transactions', action.payload.data, action.payload.config || {});
  removeOfflineItem(OFFLINE_FINANCIAL_KEY, action.payload.tempId);
  return response.data;
}
async function syncDeleteFinancial(api: AxiosInstance, action: OfflineAction) {
  const response = await api.delete(`/financial-transactions/${action.payload.id}`, action.payload.config || {});
  removeOfflineItem(OFFLINE_FINANCIAL_KEY, action.payload.id);
  return response.data;
}
async function syncReceivePayment(api: AxiosInstance, action: OfflineAction) {
  const response = await api.put(`/orders/${action.payload.id}`, action.payload.data, action.payload.config || {});
  removeOfflineItem(OFFLINE_ORDERS_KEY, action.payload.id);
  return response.data;
}
async function syncLocalOnlyAction(action: OfflineAction) {
  return { ok: true, localOnly: true, actionId: action.id };
}

async function runAction(api: AxiosInstance, action: OfflineAction) {
  if (action.type === 'CREATE_ORDER') return syncCreateOrder(api, action);
  if (action.type === 'UPDATE_ORDER') return syncUpdateOrder(api, action);
  if (action.type === 'DELETE_ORDER') return syncDeleteOrder(api, action);
  if (action.type === 'CREATE_PRODUCT') return syncCreateProduct(api, action);
  if (action.type === 'UPDATE_PRODUCT') return syncUpdateProduct(api, action);
  if (action.type === 'DELETE_PRODUCT') return syncDeleteProduct(api, action);
  if (action.type === 'CREATE_CLIENT') return syncCreateClient(api, action);
  if (action.type === 'UPDATE_CLIENT') return syncUpdateClient(api, action);
  if (action.type === 'DELETE_CLIENT') return syncDeleteClient(api, action);
  if (action.type === 'CREATE_FINANCIAL') return syncCreateFinancial(api, action);
  if (action.type === 'DELETE_FINANCIAL') return syncDeleteFinancial(api, action);
  if (action.type === 'RECEIVE_PAYMENT') return syncReceivePayment(api, action);
  return syncLocalOnlyAction(action);
}

export async function syncOfflineQueue(api: AxiosInstance) {
  if (!navigator.onLine) {
    return { synced: 0, failed: getPendingOfflineQueue().length };
  }

  const pending = getPendingOfflineQueue().reverse();
  let synced = 0;
  let failed = 0;

  for (const action of pending) {
    try {
      await runAction(api, action);
      updateQueueItem(action.id, { syncedAt: new Date().toISOString(), error: null });
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
        error: error?.response?.data?.error || error?.message || 'Erro ao sincronizar',
      });
    }
  }

  window.dispatchEvent(new Event(OFFLINE_STATUS_EVENT));
  return { synced, failed };
}
