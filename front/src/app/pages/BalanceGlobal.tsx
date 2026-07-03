import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/apiClient';
import { useAuth } from '../context/AuthContext';

interface BalanceRow {
  socioId: string;
  nombre: string;
  aportado: number;
  pagado: number;
  objetivo: number;
  balance: number;
}

interface DashboardData {
  totalGastos: number;
  totalPagos: number;
  miembros: number;
  balances: BalanceRow[];
}

export function BalanceGlobal() {
  const { grupoActivo } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!grupoActivo) return;
    setLoading(true);
    setError(null);
    apiFetch<DashboardData>(`/api/dashboard/${grupoActivo.id}`)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [grupoActivo]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', minimumFractionDigits: 2,
    }).format(amount ?? 0);

  if (!grupoActivo) {
    return (
      <Layout title="Balance Global">
        <p className="text-center text-gray-500 py-20">
          Seleccioná un grupo desde{' '}
          <a href="/mis-grupos" className="underline">Mis Grupos</a>.
        </p>
      </Layout>
    );
  }

  const saldoInicial   = data ? (data.totalPagos ?? 0) - (data.totalGastos ?? 0) : 0;
  const totalIngresos  = data?.totalPagos ?? 0;
  const totalEgresos   = data?.totalGastos ?? 0;
  const saldoCierre    = saldoInicial + totalIngresos - totalEgresos;

  return (
    <Layout title="Balance Global">
      <div className="space-y-6 pb-20">

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="size-8 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 text-red-600 text-sm">{error}</CardContent>
          </Card>
        )}

        {!loading && data && (
          <>
            {/* Fondo Operativo */}
            <Card>
              <CardHeader>
                <CardTitle>Fondo Operativo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Saldo Inicial</span>
                  <span className={`font-medium ${saldoInicial < 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(saldoInicial)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Ingresos (pagos recibidos)</span>
                    <span className="font-medium">{formatCurrency(totalIngresos)}</span>
                  </div>
                  <div className="pl-6 space-y-2 text-sm">
                    {(data.balances ?? []).filter(b => b.pagado > 0).map(b => (
                      <div key={b.socioId} className="flex justify-between items-center">
                        <span className="text-gray-600">{b.nombre}</span>
                        <span>{formatCurrency(b.pagado)}</span>
                      </div>
                    ))}
                    {(data.balances ?? []).every(b => b.pagado === 0) && (
                      <p className="text-gray-400 text-xs">Sin pagos registrados</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span>Egresos del mes</span>
                  <span className="text-red-600 font-medium">
                    -{formatCurrency(Math.abs(totalEgresos))}
                  </span>
                </div>

                <div className="border-t-2 border-gray-300 my-4" />

                <div className="flex justify-between items-center py-2">
                  <span className="font-bold text-lg">Saldo al Cierre</span>
                  <span className={`font-bold text-2xl ${
                    saldoCierre >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(saldoCierre)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* CAMBIO: se eliminó la card "Balance por Miembro" */}

            {/* Datos de Juicios */}
            <Card>
              <CardHeader><CardTitle>Datos de Juicios</CardTitle></CardHeader>
              <CardContent>
                <p className="text-gray-500 text-center py-2">Sin movimientos</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
}