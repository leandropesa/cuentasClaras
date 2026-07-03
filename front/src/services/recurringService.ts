import { apiFetch } from "./apiClient";

export interface RecurringTemplateDto {
  id: number;
  consortiumId: number;
  descripcion: string;
  monto: number;
  categoria: string;
  cargadoPorEmail: string;
  activo: boolean;
  lastGeneratedYear: number | null;
  lastGeneratedMonth: number | null;
  createdAt: string;
}

const MESES = [
  '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export function lastGeneratedLabel(t: RecurringTemplateDto): string {
  if (!t.lastGeneratedYear || !t.lastGeneratedMonth) return 'Nunca aplicada';
  return `${MESES[t.lastGeneratedMonth]} ${t.lastGeneratedYear}`;
}

export const recurringService = {
  crear: (grupoId: string, descripcion: string, monto: number, categoria: string): Promise<RecurringTemplateDto> =>
    apiFetch<RecurringTemplateDto>('/api/recurrentes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grupoId, descripcion, monto, categoria }),
    }),

  listar: (grupoId: number): Promise<RecurringTemplateDto[]> =>
    apiFetch<RecurringTemplateDto[]>(`/api/recurrentes/${grupoId}`),

  actualizarMonto: (id: number, monto: number): Promise<RecurringTemplateDto> =>
    apiFetch<RecurringTemplateDto>(`/api/recurrentes/${id}/monto`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monto }),
    }),

  toggle: (id: number): Promise<RecurringTemplateDto> =>
    apiFetch<RecurringTemplateDto>(`/api/recurrentes/${id}/toggle`, { method: 'PUT' }),

  aplicar: (id: number): Promise<RecurringTemplateDto> =>
    apiFetch<RecurringTemplateDto>(`/api/recurrentes/${id}/aplicar`, { method: 'POST' }),

};
