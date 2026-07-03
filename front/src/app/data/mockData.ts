export interface Socio {
  id: string;
  nombre: string;
  email: string;
}

export interface Gasto {
  id: string;
  titulo: string;
  monto: number;
  fecha: string;
  categoria: string;
  socioId: string;
  comprobanteUrl?: string;
}

export interface Pago {
  id: string;
  socioId: string;
  monto: number;
  fecha: string;
  estado: 'PAGADO' | 'PENDIENTE' | 'MORA';
  comprobanteUrl?: string;
}

export const socios: Socio[] = [
  { id: '1', nombre: 'Rama', email: 'rama@socios.com' },
  { id: '2', nombre: 'Carlos', email: 'carlos@socios.com' },
  { id: '3', nombre: 'María', email: 'maria@socios.com' },
  { id: '4', nombre: 'Ana', email: 'ana@socios.com' },
];

export const gastos: Gasto[] = [
  {
    id: '1',
    titulo: 'Jardinero - Marzo',
    monto: 15000,
    fecha: '2026-03-15',
    categoria: 'Mantenimiento',
    socioId: '1',
  },
  {
    id: '2',
    titulo: 'Plomero - Reparación',
    monto: 8500,
    fecha: '2026-03-12',
    categoria: 'Reparaciones',
    socioId: '2',
  },
  {
    id: '3',
    titulo: 'Servicios de Limpieza',
    monto: 12000,
    fecha: '2026-03-10',
    categoria: 'Limpieza',
    socioId: '3',
  },
  {
    id: '4',
    titulo: 'Seguridad - Marzo',
    monto: 20000,
    fecha: '2026-03-08',
    categoria: 'Seguridad',
    socioId: '1',
  },
  {
    id: '5',
    titulo: 'Electricista',
    monto: 6500,
    fecha: '2026-03-05',
    categoria: 'Reparaciones',
    socioId: '4',
  },
];

export const pagos: Pago[] = [
  {
    id: '1',
    socioId: '1',
    monto: 15500,
    fecha: '2026-03-01',
    estado: 'PAGADO',
  },
  {
    id: '2',
    socioId: '2',
    monto: 15500,
    fecha: '2026-03-02',
    estado: 'PAGADO',
  },
  {
    id: '3',
    socioId: '3',
    monto: 15500,
    fecha: '2026-03-15',
    estado: 'PENDIENTE',
  },
  {
    id: '4',
    socioId: '4',
    monto: 15500,
    fecha: '2026-02-20',
    estado: 'MORA',
  },
];

// Usuario actual (simulado)
export const currentUserId = '1'; // Rama




// Balance Global
export interface BalanceGlobalData {
  periodo: string;
  saldoInicial: number;
  ingresos: {
    expensasEnTermino: number;
    expensasAdeudadas: number;
    intereses: number;
    gastosParticulares: number;
  };
  egresos: number;
  saldoCierre: number;
  tieneJuicios: boolean;
}

export const balanceGlobalData: BalanceGlobalData[] = [
  {
    periodo: '2026-04',
    saldoInicial: -12340.50,
    ingresos: {
      expensasEnTermino: 45680.00,
      expensasAdeudadas: 12340.60,
      intereses: 1450.00,
      gastosParticulares: 4270.00,
    },
    egresos: 87980.50,
    saldoCierre: -36580.40,
    tieneJuicios: false,
  },
  {
    periodo: '2026-03',
    saldoInicial: 18560.30,
    ingresos: {
      expensasEnTermino: 52340.00,
      expensasAdeudadas: 8920.00,
      intereses: 890.00,
      gastosParticulares: 2590.60,
    },
    egresos: 95640.90,
    saldoCierre: -12340.50,
    tieneJuicios: false,
  },
  {
    periodo: '2026-02',
    saldoInicial: -8450.00,
    ingresos: {
      expensasEnTermino: 48200.00,
      expensasAdeudadas: 15340.30,
      intereses: 1200.00,
      gastosParticulares: 3500.00,
    },
    egresos: 41230.00,
    saldoCierre: 18560.30,
    tieneJuicios: false,
  },
];

// Cuenta Corriente
export interface CuentaCorrienteData {
  periodo: string;
  expensaBase: number;
  saldoAnterior: number;
  creditoAFavor: number;
  intereses: number;
  totalAPagar: number;
  estado: 'PENDIENTE' | 'PAGADO' | 'EN MORA' | 'A FAVOR';
}


export const cuentaCorrienteData: CuentaCorrienteData[] = [
  {
    periodo: '2026-04',
    expensaBase: 184228.00,
    saldoAnterior: -377667.00,
    creditoAFavor: 19500.00,
    intereses: 0,
    totalAPagar: 542395.00,
    estado: 'PAGADO',
  },
  {
    periodo: '2026-03',
    expensaBase: 184228.00,
    saldoAnterior: -184228.00,
    creditoAFavor: 0,
    intereses: 9211.00,
    totalAPagar: 377667.00,
    estado: 'EN MORA',
  },
  {
    periodo: '2026-02',
    expensaBase: 184228.00,
    saldoAnterior: 0,
    creditoAFavor: 0,
    intereses: 0,
    totalAPagar: 184228.00,
    estado: 'PENDIENTE',
  },
  {
    periodo: '2026-01',
    expensaBase: 184228.00,
    saldoAnterior: 0,
    creditoAFavor: 0,
    intereses: 0,
    totalAPagar: 184228.00,
    estado: 'PAGADO',
  },
];
