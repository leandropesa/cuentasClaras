import { apiFetch } from './apiClient';

// ── Tipos que refleja el backend ──────────────────────────────────────────────

export interface ConsortiumMemberDto {
  userId: number;
  nombre: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  balance: number;
  metrosCuadrados: number;
}

export interface ConsortiumDto {
  id: number;
  name: string;
  initialBalance: number;
  createdAt: string;
  members: ConsortiumMemberDto[];
  invitationCode: string;
  cbu?: string;
  alias?: string;
  titular?: string;
  pendingInvitations: InvitationDto[];
  diaCierre?: number | null;
}

export interface JoinByCodeRequest {
  code: string;
  metrosCuadrados?: number;
}

export interface CreateConsortiumRequest {
  name: string;
  initialBalance: number;
  cbu?: string;
  alias?: string;
  titular?: string;
}

export interface UpdateBankDetailsRequest {
  cbu: string;
  alias: string;
  titular: string;
}

export interface InvitationDto {
  id: number;
  consortiumId: number;
  consortiumName: string;
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'PROCESSED';
  createdAt: string;
  acceptedAt?: string | null;
  processedAt?: string | null;
  metrosCuadrados?: number | null;
}

// ── Funciones de API ──────────────────────────────────────────────────────────

/** Crea un consorcio nuevo. El usuario autenticado pasa a ser ADMIN. */
export function createConsortium(data: CreateConsortiumRequest): Promise<ConsortiumDto> {
  return apiFetch<ConsortiumDto>('/api/consortiums', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/** Devuelve todos los consorcios (endpoint de debug). */
export function getAllConsortiums(): Promise<ConsortiumDto[]> {
  return apiFetch<ConsortiumDto[]>('/api/consortiums');
}

/**
 * Devuelve solo los consorcios donde el usuario autenticado es miembro.
 * Es el endpoint correcto para "Mis Grupos".
 */
export function getMyConsortiums(): Promise<ConsortiumDto[]> {
  return apiFetch<ConsortiumDto[]>('/api/consortiums/mine');
}

/** Devuelve un consorcio por ID. */
export function getConsortiumById(id: number): Promise<ConsortiumDto> {
  return apiFetch<ConsortiumDto>(`/api/consortiums/${id}`);
}

/** Agrega un usuario (por email) al consorcio. Solo ADMIN. */
export function addMember(consortiumId: number, email: string, metrosCuadrados?: number): Promise<InvitationDto> {
  return apiFetch<InvitationDto>(`/api/consortiums/${consortiumId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, metrosCuadrados }),
  });
}

/** Actualiza los metros cuadrados de una invitación pendiente. Solo ADMIN. */
export function updateInvitationMetrosCuadrados(consortiumId: number, invitationId: number, metrosCuadrados: number): Promise<InvitationDto> {
  return apiFetch<InvitationDto>(`/api/consortiums/${consortiumId}/invitations/${invitationId}/metros-cuadrados`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metrosCuadrados }),
  });
}

/** Busca un grupo por código de invitación (sin unirse). */
export function getConsortiumByCode(code: string): Promise<ConsortiumDto> {
  return apiFetch<ConsortiumDto>(`/api/consortiums/by-code/${encodeURIComponent(code)}`);
}

/** Unirse a un grupo mediante código de invitación. */
export function joinByCode(code: string, metrosCuadrados?: number): Promise<ConsortiumDto> {
  return apiFetch<ConsortiumDto>('/api/consortiums/join-by-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, metrosCuadrados }),
  });
}

/** Elimina el consorcio. Solo ADMIN. */
export function deleteConsortium(consortiumId: number): Promise<void> {
  return apiFetch<void>(`/api/consortiums/${consortiumId}`, {
    method: 'DELETE',
  });
}

/** El usuario autenticado abandona el consorcio. */
export function leaveConsortium(consortiumId: number): Promise<void> {
  return apiFetch<void>(`/api/consortiums/${consortiumId}/members/me`, {
    method: 'DELETE',
  });
}

/** Promueve a admin. */
export function promoteToAdmin(consortiumId: number, userId: number): Promise<ConsortiumDto> {
  return apiFetch<ConsortiumDto>(`/api/consortiums/${consortiumId}/members/${userId}/promote`, {
    method: 'POST',
  });
}

/** Degrada de admin. */
export function demoteFromAdmin(consortiumId: number, userId: number): Promise<ConsortiumDto> {
  return apiFetch<ConsortiumDto>(`/api/consortiums/${consortiumId}/members/${userId}/demote`, {
    method: 'POST',
  });
}

/** Expulsa a un miembro. */
export function removeMember(consortiumId: number, userId: number): Promise<void> {
  return apiFetch<void>(`/api/consortiums/${consortiumId}/members/${userId}`, {
    method: 'DELETE',
  });
}

/** Actualiza los datos bancarios del consorcio. Solo admin. */
export function updateBankDetails(consortiumId: number, data: UpdateBankDetailsRequest): Promise<ConsortiumDto> {
  return apiFetch<ConsortiumDto>(`/api/consortiums/${consortiumId}/bank-details`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/** Actualiza el nombre del consorcio. Solo admin. */
export function updateConsortiumName(consortiumId: number, name: string): Promise<ConsortiumDto> {
  return apiFetch<ConsortiumDto>(`/api/consortiums/${consortiumId}/name`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

/** Actualiza el día de cierre automático del período. Solo admin. */
export function updateDiaCierre(consortiumId: number, dia: number | null): Promise<ConsortiumDto> {
  return apiFetch<ConsortiumDto>(`/api/consortiums/${consortiumId}/dia-cierre`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dia }),
  });
}

/** Actualiza los metros cuadrados de un miembro. Solo admin. */
export function updateMemberMetrosCuadrados(
  consortiumId: number,
  userId: number,
  metrosCuadrados: number
): Promise<ConsortiumDto> {
  return apiFetch<ConsortiumDto>(
    `/api/consortiums/${consortiumId}/members/${userId}/metros-cuadrados`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrosCuadrados }),
    }
  );
}