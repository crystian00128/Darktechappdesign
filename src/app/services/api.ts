import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-42377006`;

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }

  return data;
}

// ==================== INICIALIZAÇÃO ====================
export async function initDatabase() {
  return fetchAPI('/init', { method: 'POST' });
}

export async function resetDatabase() {
  return fetchAPI('/reset', { method: 'POST' });
}

// ==================== LOGIN ====================
export async function loginStep1(username: string) {
  return fetchAPI('/login/step1', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });
}

export async function loginStep2(username: string, pin: string) {
  return fetchAPI('/login/step2', {
    method: 'POST',
    body: JSON.stringify({ username, pin }),
  });
}

// ==================== CÓDIGOS DE CONVITE ====================
export async function generateInviteCode(type: 'vendedor' | 'cliente' | 'motorista', generatedBy: string) {
  return fetchAPI('/codes/generate', {
    method: 'POST',
    body: JSON.stringify({ type, generatedBy }),
  });
}

export async function validateInviteCode(code: string) {
  return fetchAPI('/codes/validate', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function getInviteCodes(type: 'vendedor' | 'cliente' | 'motorista') {
  return fetchAPI(`/codes/${type}`);
}

// ==================== REGISTRO ====================
export async function registerUser(userData: {
  username: string;
  pin: string;
  name: string;
  role: 'admin' | 'vendedor' | 'cliente' | 'motorista';
  inviteCode?: string;
}) {
  return fetchAPI('/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

// ==================== USUÁRIOS ====================
export async function getUsers(role: 'admin' | 'vendedor' | 'cliente' | 'motorista') {
  return fetchAPI(`/users/${role}`);
}

// Buscar usuários criados por um usuário específico
export async function getUsersCreatedBy(username: string) {
  return fetchAPI(`/users/created-by/${username}`);
}

// Buscar quem criou um usuário específico
export async function getUserCreator(username: string) {
  return fetchAPI(`/users/${username}/creator`);
}