import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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

type Estado = 'A FAVOR' | 'EN MORA' | 'BALANCEADO';

function getEstado(balance: number): Estado {
  if (balance > 0)  return 'A FAVOR';
  if (balance < 0)  return 'EN MORA';
  return 'BALANCEADO';
}

function EstadoBadge({ estado }: { estado: Estado }) {
  if (estado === 'A FAVOR') {
    return (
        <Badge className="gap-1 bg-blue-600 hover:bg-blue-700">
          <CheckCircle className="size-3" />
          A FAVOR
        </Badge>
    );
  }
  if (estado === 'EN MORA') {
    return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="size-3" />
          EN MORA
        </Badge>
    );
  }
  return (
      <Badge variant="secondary" className="gap-1">
        <AlertCircle className="size-3" />
        BALANCEADO
      </Badge>
  );
}

export function EstadoCuentas() {
  const navigate             = useNavigate();
  const { grupoActivo, user } = useAuth();
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!grupoActivo) return;
    setLoading(true);
    setError(null);
    // El endpoint devuelve BalanceRowDto[] directamente (array, sin wrapper)
    apiFetch<BalanceRow[]>(`/api/balance/${grupoActivo.id}`)
        .then((data) => setBalances(Array.isArray(data) ? data : []))
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
  }, [grupoActivo]);

  const formatCurrency = (n: number) =>
      new Intl.NumberFormat('es-AR', {
        style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
      }).format(n ?? 0);

  if (!grupoActivo) {
    return (
        <Layout title="Estado de Cuentas">
          <div className="text-center py-20 text-gray-500 space-y-4">
            <p>Seleccioná un grupo para ver el estado de cuentas.</p>
            <Button onClick={() => navigate('/mis-grupos')}>Ir a Mis Grupos</Button>
          </div>
        </Layout>
    );
  }

  // Estadísticas derivadas del balance real
  const totalAFavor    = balances.filter((b) => b.balance > 0).length;
  const totalEnMora    = balances.filter((b) => b.balance < 0).length;
  const totalBalanceado = balances.filter((b) => b.balance === 0).length;

  // Fila del usuario autenticado
  const miFila   = balances.find((b) => b.socioId === user?.id);
  const miEstado = miFila ? getEstado(miFila.balance) : null;

  return (
      <Layout title="Estado de Cuentas">
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

          {!loading && !error && (
              <>
                {/* Resumen */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6 text-center">
                      <p className="text-2xl font-bold text-blue-700">{totalAFavor}</p>
                      <p className="text-xs text-gray-600 mt-1">A Favor</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6 text-center">
                      <p className="text-2xl font-bold text-green-700">{totalBalanceado}</p>
                      <p className="text-xs text-gray-600 mt-1">Balanceados</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="pt-6 text-center">
                      <p className="text-2xl font-bold text-red-700">{totalEnMora}</p>
                      <p className="text-xs text-gray-600 mt-1">En Mora</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Mi situación */}
                {miFila && miEstado && (
                    <Card className={
                      miEstado === 'A FAVOR'
                          ? 'bg-blue-50 border-blue-200'
                          : miEstado === 'EN MORA'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-green-50 border-green-200'
                    }>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Mi Situación</CardTitle>
                          <EstadoBadge estado={miEstado} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Cuota del período</span>
                          <span className="font-medium">{formatCurrency(miFila.objetivo)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Lo que aportaste</span>
                          <span className="font-medium text-green-700">
                      {formatCurrency(miFila.aportado)}
                    </span>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between items-center">
                      <span className="font-bold">
                        {miFila.balance >= 0 ? 'A tu favor' : 'Debés'}
                      </span>
                            <span className={`font-bold text-xl ${
                                miFila.balance >= 0 ? 'text-blue-700' : 'text-red-700'
                            }`}>
                        {formatCurrency(Math.abs(miFila.balance))}
                      </span>
                          </div>
                        </div>

                        {miEstado === 'EN MORA' && (
                            <div className="mt-2 p-3 bg-white border border-blue-200 rounded-lg">
                              <p className="text-sm font-medium text-blue-800 mb-2">
                                Información para pagar
                              </p>
                              <div className="space-y-1 text-xs text-gray-600">
                                <p><span className="font-medium">CBU:</span> {grupoActivo?.cbu ?? '—'}</p>
                                <p><span className="font-medium">Alias:</span> {grupoActivo?.alias ?? '—'}</p>
                                <p><span className="font-medium">Titular:</span> {grupoActivo?.titular ?? '—'}</p>
                              </div>
                            </div>
                        )}
                      </CardContent>
                    </Card>
                )}

                {/* Estado del grupo completo */}
                <Card>
                  <CardHeader>
                    <CardTitle>Estado por Miembro — {grupoActivo.nombre}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {balances.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Sin movimientos aún.
                        </p>
                    ) : (
                        <div className="space-y-3">
                          {balances.map((row) => {
                            const estado = getEstado(row.balance);
                            return (
                                <div
                                    key={row.socioId}
                                    className={`p-4 border rounded-lg ${
                                        row.socioId === user?.id
                                            ? 'bg-blue-50 border-blue-200'
                                            : 'bg-gray-50'
                                    }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <p className="font-semibold">{row.nombre}</p>
                                      <p className="text-xs text-gray-500">
                                        Aportó: {formatCurrency(row.aportado)} /
                                        Cuota: {formatCurrency(row.objetivo)}
                                      </p>
                                    </div>
                                    <EstadoBadge estado={estado} />
                                  </div>
                                  <div className="flex justify-between items-center text-sm pt-2 border-t">
                                    <span className="text-gray-600">Balance</span>
                                    <span className={`font-bold ${
                                        row.balance > 0
                                            ? 'text-blue-700'
                                            : row.balance < 0
                                                ? 'text-red-700'
                                                : 'text-gray-600'
                                    }`}>
                              {row.balance > 0 ? '+' : ''}
                                      {formatCurrency(row.balance)}
                            </span>
                                  </div>
                                </div>
                            );
                          })}
                        </div>
                    )}
                  </CardContent>
                </Card>

                {/* Info bancaria */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm">Datos para Transferencias</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p><span className="font-medium">CBU:</span> {grupoActivo?.cbu ?? '—'}</p>
                    <p><span className="font-medium">Alias:</span> {grupoActivo?.alias ?? '—'}</p>
                    <p><span className="font-medium">Titular:</span> {grupoActivo?.titular ?? '—'}</p>
                  </CardContent>
                </Card>
              </>
          )}
        </div>
      </Layout>
  );
}