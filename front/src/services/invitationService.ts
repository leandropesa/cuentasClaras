import { apiFetch } from './apiClient';

export interface InvitationAcceptResponse {
  consortiumId: number;
  consortiumName: string;
  status: 'PENDING' | 'ACCEPTED' | 'PROCESSED';
}

export interface InvitationProcessResponse {
  processedCount: number;
}

export function acceptInvitation(token: string): Promise<InvitationAcceptResponse> {
  return apiFetch<InvitationAcceptResponse>(`/api/invitations/accept?token=${encodeURIComponent(token)}`);
}

export function processMyInvitations(): Promise<InvitationProcessResponse> {
  return apiFetch<InvitationProcessResponse>('/api/invitations/process-mine', {
    method: 'POST',
  });
}
