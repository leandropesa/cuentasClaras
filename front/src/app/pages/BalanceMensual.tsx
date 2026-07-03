import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { apiFetch } from '../../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

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
  miembros: number;
  balances: BalanceRow[];
  movimientos: { id: string }[];
}

export function BalanceMensual() {
  const navigate             = useNavigate();
  const { grupoActivo }      = useAuth();
  const [data, setData]      = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]    = useState<string | null>(null);

  useEffect(() => {
    if (!grupoActivo) return;
    setLoading(true);
    setError(null);
    apiFetch<DashboardData>(`/api/dashboard/${grupoActivo.id}`)
        .then(setData)
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
  }, [grupoActivo]);

  const formatCurrency = (n: number) =>
      new Intl.NumberFormat('es-AR', {
        style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
      }).format(n ?? 0);

  const mesActual = new Date().toLocaleDateString('es-AR', {
    month: 'long', year: 'numeric',
  });

  if (!grupoActivo) {
    return (
        <Layout title="Balance Mensual">
          <div className="text-center py-20 text-gray-500 space-y-4">
            <p>Seleccioná un grupo para ver el balance.</p>
            <Button onClick={() => navigate('/mis-grupos')}>Ir a Mis Grupos</Button>
          </div>
        </Layout>
    );
  }

  return (
      <Layout title="Balance Mensual">
        <div className="space-y-6">

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
                {/* Resumen */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-center">
                      {grupoActivo.nombre} — {mesActual}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <p className="text-sm text-gray-600">Total de Gastos</p>
                      <p className="font-bold text-4xl text-blue-900">
                        {formatCurrency(data.totalGastos)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {data.movimientos.length} transacciones ·{' '}
                        {data.miembros} miembros
                      </p>
                      {data.miembros > 0 && (
                          <p className="text-sm font-medium text-blue-700">
                            Cuota por miembro:{' '}
                            {formatCurrency(data.totalGastos / data.miembros)}
                          </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Compensación por socio */}
                <Card>
                  <CardHeader>
                    <CardTitle>Compensación por Socio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.balances.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Sin datos de balance aún.
                        </p>
                    ) : (
                        <div className="space-y-4">
                          {data.balances.map((b) => {
                            const tipo =
                                b.balance > 100
                                    ? 'RECUPERAR'
                                    : b.balance < -100
                                        ? 'APORTAR'
                                        : 'BALANCEADO';

                            return (
                                <div
                                    key={b.socioId}
                                    className="p-4 border rounded-lg bg-gray-50"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <p className="font-semibold text-lg">{b.nombre}</p>
                                      <p className="text-sm text-gray-500">
                                        Aportó: {formatCurrency(b.aportado)}
                                      </p>
                                    </div>
                                    <Badge
                                        variant={
                                          tipo === 'RECUPERAR'
                                              ? 'default'
                                              : tipo === 'APORTAR'
                                                  ? 'destructive'
                                                  : 'secondary'
                                        }
                                        className="gap-1"
                                    >
                                      {tipo === 'RECUPERAR' && (
                                          <TrendingUp className="size-3" />
                                      )}
                                      {tipo === 'APORTAR' && (
                                          <TrendingDown className="size-3" />
                                      )}
                                      {tipo === 'BALANCEADO' && (
                                          <Minus className="size-3" />
                                      )}
                                      {tipo}
                                    </Badge>
                                  </div>

                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                              <span className="text-gray-600">
                                Cuota que le corresponde:
                              </span>
                                      <span className="font-medium">
                                {formatCurrency(b.objetivo)}
                              </span>
                                    </div>

                                    {tipo !== 'BALANCEADO' && (
                                        <div className="pt-2 border-t">
                                          <div className="flex justify-between items-center">
                                  <span className="font-medium">
                                    {tipo === 'APORTAR'
                                        ? 'Debe aportar:'
                                        : 'Debe recuperar:'}
                                  </span>
                                            <span
                                                className={`font-bold text-lg ${
                                                    tipo === 'APORTAR'
                                                        ? 'text-red-600'
                                                        : 'text-green-600'
                                                }`}
                                            >
                                    {formatCurrency(Math.abs(b.balance))}
                                  </span>
                                          </div>
                                        </div>
                                    )}

                                    {tipo === 'BALANCEADO' && (
                                        <div className="pt-2 border-t text-center">
                                          <p className="text-sm text-gray-500">
                                            ✓ Este miembro está balanceado
                                          </p>
                                        </div>
                                    )}
                                  </div>
                                </div>
                            );
                          })}
                        </div>
                    )}
                  </CardContent>
                </Card>
              </>
          )}
        </div>
      </Layout>
  );
}