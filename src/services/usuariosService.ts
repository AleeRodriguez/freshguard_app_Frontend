import API_URL from '../config/api';

export interface UsuarioAPI {
  id: number;
  uid: string;
  nombre: string;
  email: string;
  rol: 'encargado' | 'empleado';
  activo: boolean;
}

export async function getUsuarios(): Promise<UsuarioAPI[]> {
  const res = await fetch(`${API_URL}/api/usuarios`);
  if (!res.ok) throw new Error('Error al obtener usuarios');
  return res.json();
}

export async function getUsuarioPorUid(uid: string): Promise<UsuarioAPI | null> {
  try {
    const res = await fetch(`${API_URL}/api/usuarios/${uid}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function crearUsuario(data: {
  uid: string;
  nombre: string;
  email: string;
  rol: 'encargado' | 'empleado';
}): Promise<UsuarioAPI> {
  const res = await fetch(`${API_URL}/api/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, activo: true }),
  });
  if (!res.ok) throw new Error('Error al crear usuario');
  return res.json();
}

export async function actualizarUsuario(uid: string, data: Partial<UsuarioAPI>): Promise<UsuarioAPI> {
  const res = await fetch(`${API_URL}/api/usuarios/${uid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar usuario');
  return res.json();
}