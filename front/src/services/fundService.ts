// front/src/services/fundService.ts
import { apiFetch } from './apiClient';

export interface FundMovementDto {
  id: number;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  monto: number;
  registradoPor: string | null;
  fecha: string;
}

export interface FundSummaryDto {
  saldo: number;
  totalIngresos: number;
  totalEgresos: number;
  movimientos: FundMovementDto[];
}

export interface CreateFundMovementRequest {
  grupoId: string;
  tipo: 'INGRESO' | 'EGRESO';
  concepto: string;
  monto: number;
  fecha?: string;
}

export function getFundSummary(grupoId: string): Promise<FundSummaryDto> {
  return apiFetch<FundSummaryDto>(`/api/fondo/${grupoId}`);
}

export function createFundMovement(req: CreateFundMovementRequest): Promise<FundMovementDto> {
  return apiFetch<FundMovementDto>('/api/fondo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
}