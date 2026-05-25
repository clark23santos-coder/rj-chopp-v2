export const AUDIT_STORAGE_KEY = 'rjchopp_audit_logs';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'DELIVERED'
  | 'FINISHED'
  | 'CANCELLED'
  | 'WITHDRAWAL_OK'
  | 'LOGIN'
  | 'LOGOUT'
  | 'BACKUP'
  | 'RESTORE'
  | 'SETTINGS';

export type AuditArea =
  | 'Pedidos'
  | 'Produtos'
  | 'Clientes'
  | 'Financeiro'
  | 'Despesas'
  | 'Retiradas'
  | 'Mapa'
  | 'Configurações'
  | 'Backup'
  | 'Login'
  | 'Sistema';

export type AuditLog = {
  id: string;
  area: AuditArea;
  action: AuditAction;
  title: string;
  description?: string;
  userName: string;
  userRole: string;
  userRoleLabel: string;
  createdAt: string;
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
}

export function getCurrentAuditUser() {
  try {
    const saved = localStorage.getItem('rjchopp_user');

    if (!saved) {
      return {
        name: 'Usuário não identificado',
        role: 'UNKNOWN',
        roleLabel: 'Sem cargo',
      };
    }

    const user = JSON.parse(saved);

    return {
      name: user.name || user.username || 'Usuário',
      role: user.role || 'UNKNOWN',
      roleLabel: user.roleLabel || user.role || 'Usuário',
    };
  } catch {
    return {
      name: 'Usuário não identificado',
      role: 'UNKNOWN',
      roleLabel: 'Sem cargo',
    };
  }
}

export function addAuditLog(data: {
  area: AuditArea;
  action: AuditAction;
  title: string;
  description?: string;
}) {
  const user = getCurrentAuditUser();
  const currentLogs = readStorage(AUDIT_STORAGE_KEY, []);

  const newLog: AuditLog = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    area: data.area,
    action: data.action,
    title: data.title,
    description: data.description || '',
    userName: user.name,
    userRole: user.role,
    userRoleLabel: user.roleLabel,
    createdAt: new Date().toISOString(),
  };

  const updatedLogs = [newLog, ...currentLogs].slice(0, 1000);

  writeStorage(AUDIT_STORAGE_KEY, updatedLogs);

  return newLog;
}

export function getAuditLogs(): AuditLog[] {
  const logs = readStorage(AUDIT_STORAGE_KEY, []);

  return Array.isArray(logs) ? logs : [];
}

export function clearAuditLogs() {
  writeStorage(AUDIT_STORAGE_KEY, []);
}
