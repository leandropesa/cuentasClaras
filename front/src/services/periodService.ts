import { apiFetch } from "./apiClient";

export interface PeriodMemberSnapshot {
  userId: number;
  nombreMiembro: string;
  balanceAlCierre: number;
}

export interface PeriodDto {
  id: number;
  consortiumId: number;
  mes: number;
  anio: number;
  estado: "ABIERTO" | "CERRADO";
  fechaApertura: string;
  fechaCierre: string | null;
  saldoInicialFondo: number;
  saldoFinalFondo: number | null;
  totalGastos: number;
  totalPagos: number;
  snapshots: PeriodMemberSnapshot[];
}

export const periodService = {
  getActual: (consortiumId: number): Promise<PeriodDto> =>
    apiFetch<PeriodDto>(`/api/periodos/${consortiumId}/actual`),

  getHistorial: (consortiumId: number): Promise<PeriodDto[]> =>
    apiFetch<PeriodDto[]>(`/api/periodos/${consortiumId}`),

  getDetalle: (consortiumId: number, periodId: number): Promise<PeriodDto> =>
    apiFetch<PeriodDto>(`/api/periodos/${consortiumId}/${periodId}`),

  cerrar: (consortiumId: number): Promise<PeriodDto> =>
    apiFetch<PeriodDto>(`/api/periodos/${consortiumId}/cerrar`, { method: "POST" }),
};
