import { apiFetch } from "./apiClient";

export interface MoraNotification {
  consortiumId: number;
  consortiumName: string;
  userId: number;
  userName: string;
  userEmail: string;
  deuda: number;
  fechaVencimiento: string | null;
  moraDesdeFecha: string | null;
  diasEnMora: number;
  adminNotificado: boolean;
}

export const moraService = {
  getMiEstado: async (consortiumId: number): Promise<MoraNotification | null> => {
    try {
      return await apiFetch<MoraNotification>(`/api/mora/mi-estado/${consortiumId}`);
    } catch {
      return null;
    }
  },

  getMiembrosEnMora: async (consortiumId: number): Promise<MoraNotification[]> => {
    return await apiFetch<MoraNotification[]>(`/api/mora/consorcio/${consortiumId}`);
  },

  setFechaVencimiento: async (
    consortiumId: number,
    userId: number,
    fechaVencimiento: string
  ): Promise<void> => {
    await apiFetch("/api/mora/fecha-vencimiento", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consortiumId, userId, fechaVencimiento }),
    });
  },

  notificarAdmin: async (consortiumId: number): Promise<MoraNotification[]> => {
    return await apiFetch<MoraNotification[]>(`/api/mora/notificar/${consortiumId}`, {
      method: "POST",
    });
  },

  evaluarManual: async (): Promise<void> => {
    await apiFetch("/api/mora/evaluar", { method: "POST" });
  },
};