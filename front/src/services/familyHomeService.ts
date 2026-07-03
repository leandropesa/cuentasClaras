import { apiFetch } from './apiClient';

export interface FamilyHomeDto {
  id: number;
  name: string;
  createdAt: string;
  invitationCode: string;
  members: {
    userId: number;
    name: string;
    email: string;
    role: string;
    balance: number;
  }[];
}

export function getFamilyHomeByCode(code: string): Promise<FamilyHomeDto> {
  return apiFetch<FamilyHomeDto>(`/api/family-homes/by-code/${encodeURIComponent(code)}`);
}

export function joinFamilyHomeByCode(code: string): Promise<FamilyHomeDto> {
  return apiFetch<FamilyHomeDto>('/api/family-homes/join-by-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
}
