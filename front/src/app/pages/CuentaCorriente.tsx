import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/apiClient';

interface BalanceRow {
  socioId: string;
  nombre: string;
  aportado: number;
  pagado: number;
  objetivo: number;
  balance: number;
}

export function CuentaCorriente() {
  const { grupoActivo, user } = useAuth();
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!grupoActivo) return;
    setLoading(true);
    setError(null);
    apiFetch<BalanceRow[]>(`/api/balance/${grupoActivo.id}`)
      .then((data) => setBalances(Array.isArray(data) ? data : []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [grupoActivo]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', minimumFractionDigits: 2,
    }).format(amount ?? 0);

  const getEstado = (balance: number): string => {
    if (balance > 0) return 'A FAVOR';
    if (balance < 0) return 'EN MORA';
    return 'PAGADO';
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'A FAVOR':   return 'bg-blue-500 hover:bg-blue-600';
      case 'EN MORA':   return 'bg-red-600 hover:bg-red-700';
      case 'PAGADO':    return 'bg-green-600 hover:bg-green-700';
      default:          return 'bg-yellow-500 hover:bg-yellow-600';
    }
  };

  if (!grupoActivo) {
    return (
      <Layout title="Cuenta Corriente">
        <p className="text-center text-gray-500 py-20">
          Seleccioná un grupo desde <a href="/mis-grupos" className="underline">Mis Grupos</a>.
        </p>
      </Layout>
    );
  }

  // Fila del usuario autenticado
  const miFila = balances.find(b => b.socioId === user?.id);
  const miEstado = miFila ? getEstado(miFila.balance) : 'PENDIENTE';
  const mostrarInfoPago = miEstado === 'EN MORA' || miEstado === 'PENDIENTE';

  return (
    <Layout title="Cuenta Corriente">
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

        {!loading && !error && (
          <>
            {/* Header estado */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">{grupoActivo.nombre}</h3>
                <p className="text-sm text-gray-500">Período actual</p>
              </div>
              {miFila && (
                <Badge className={`text-sm px-3 py-1 ${getEstadoBadge(miEstado)}`}>
                  {miEstado}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Detalle del período */}
              <Card>
                <CardHeader><CardTitle>Mi Situación</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {!miFila ? (
                    <p className="text-gray-500 text-center py-4">Sin datos para tu usuario.</p>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span>Cuota del período</span>
                        <span className="font-medium">{formatCurrency(miFila.objetivo)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Lo que aportaste</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(miFila.aportado)}
                        </span>
                      </div>
                      {miFila.pagado > 0 && (
                        <div className="flex justify-between items-center">
                          <span>Pagos realizados</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(miFila.pagado)}
                          </span>
                        </div>
                      )}

                      <div className="border-t-2 border-gray-300 my-4" />

                      <div className="flex justify-between items-center py-2">
                        <span className="font-bold text-lg">
                          {miFila.balance >= 0 ? 'A tu favor' : 'Total a pagar'}
                        </span>
                        <span className={`font-bold text-2xl ${
                          miFila.balance >= 0 ? 'text-green-600' : ''
                        }`}>
                          {formatCurrency(Math.abs(miFila.balance))}
                        </span>
                      </div>

                      {mostrarInfoPago && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-3">Información para Pagos</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="font-medium text-blue-800">CBU:</p>
                              <p className="text-blue-700 font-mono">{grupoActivo?.cbu ?? '—'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-blue-800">Alias:</p>
                              <p className="text-blue-700">{grupoActivo?.alias ?? '—'}</p>
                            </div>
                            <div>
                              <p className="font-medium text-blue-800">Titular:</p>
                              <p className="text-blue-700">{grupoActivo?.titular ?? '—'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {miEstado === 'PAGADO' && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                          <p className="text-sm text-green-700 font-medium">
                            ✓ Pago verificado y confirmado
                          </p>
                        </div>
                      )}
                      {miEstado === 'A FAVOR' && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                          <p className="text-sm text-blue-700 font-medium">
                            ✓ Tenés un crédito a favor
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Resumen de todos los miembros */}
              <Card>
                <CardHeader><CardTitle>Estado del Grupo</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {balances.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Sin movimientos aún.</p>
                    ) : (
                      balances.map((row) => {
                        const estado = getEstado(row.balance);
                        return (
                          <div
                            key={row.socioId}
                            className={`p-3 rounded-lg border ${
                              row.socioId === user?.id
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-sm">{row.nombre}</span>
                              <Badge className={`text-xs px-2 py-0.5 ${getEstadoBadge(estado)}`}>
                                {estado}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Balance</span>
                              <span className={`text-sm font-semibold ${
                                row.balance >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(row.balance)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}