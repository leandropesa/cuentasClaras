import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '../components/ui/dialog';
import {
  Loader2, CheckCircle, XCircle, AlertCircle, Lock, FileDown,
} from 'lucide-react';
import { apiFetch, getAccessToken, API_BASE_URL } from '../../services/apiClient';
import { useAuth } from '../context/AuthContext';

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
  if (balance > 0) return 'A FAVOR';
  if (balance < 0) return 'EN MORA';
  return 'BALANCEADO';
}

function EstadoBadge({ estado }: { estado: Estado }) {
  if (estado === 'A FAVOR') {
    return (
      <Badge className="gap-1 bg-blue-600 hover:bg-blue-700 text-xs">
        <CheckCircle className="size-3" />
        A FAVOR
      </Badge>
    );
  }
  if (estado === 'EN MORA') {
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <XCircle className="size-3" />
        EN MORA
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      <AlertCircle className="size-3" />
      BALANCEADO
    </Badge>
  );
}

export function Cuentas() {
  const navigate = useNavigate();
  const { grupoActivo, user } = useAuth();
  const isAdmin = grupoActivo?.miRol === 'ADMIN';

  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hoy = new Date();
  const [reporteOpen, setReporteOpen]     = useState(false);
  const [reporteMes, setReporteMes]       = useState(hoy.getMonth() + 1);
  const [reporteAnio, setReporteAnio]     = useState(hoy.getFullYear());
  const [descargando, setDescargando]     = useState(false);

  const handleDescargarReporte = async () => {
    if (!grupoActivo) return;
    setDescargando(true);
    try {
      const token = getAccessToken();
      const res = await fetch(
        `${API_BASE_URL}/api/reports/monthly/${grupoActivo.id}?year=${reporteAnio}&month=${reporteMes}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Error al generar el reporte');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${String(reporteMes).padStart(2, '0')}-${reporteAnio}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setReporteOpen(false);
    } catch {
      alert('Error al descargar el reporte');
    } finally {
      setDescargando(false);
    }
  };

  useEffect(() => {
    if (!grupoActivo) return;
    setLoading(true);
    setError(null);
    apiFetch<BalanceRow[]>(`/api/balance/${grupoActivo.id}`)
      .then((data) => setBalances(Array.isArray(data) ? data : []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [grupoActivo]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(n ?? 0);

  const totalAFavor = balances.filter((b) => b.balance > 0).length;
  const totalEnMora = balances.filter((b) => b.balance < 0).length;
  const totalBalanceado = balances.filter((b) => b.balance === 0).length;

  // ── Vista de acceso restringido para no-admins ──
  if (!isAdmin) {
    return (
      <Layout title="Estado de Cuentas">
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Lock className="size-8 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-lg">Acceso restringido</p>
            <p className="text-sm text-gray-500 mt-1">
              Solo los administradores del grupo pueden ver el estado de cuentas de todos los miembros.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/cuenta-corriente')}>
            Ver mi cuenta corriente
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Estado de Cuentas">
      <div className="space-y-5 pb-4">
        {/* Botón Generar Reporte (arriba a la derecha) */}
        {isAdmin && (
          <div className="flex justify-end mb-4">
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={() => setReporteOpen(true)}
            >
              <FileDown className="size-4" />
              Generar Reporte
            </Button>
          </div>
        )}

        {/* Botón de Gestión de Mora */}
        {isAdmin && (
          <Button
            variant="outline"
            className="w-full border-red-200 text-red-700 hover:bg-red-50 gap-2"
            onClick={() => navigate('/gestion-mora')}
          >
            <AlertCircle className="size-4" />
            Gestión de mora
          </Button>
        )}

        {/* Resumen stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{totalAFavor}</p>
              <p className="text-xs text-gray-500 mt-1">A Favor</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-2xl font-bold text-green-700">{totalBalanceado}</p>
              <p className="text-xs text-gray-500 mt-1">Balanceados</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-2xl font-bold text-red-700">{totalEnMora}</p>
              <p className="text-xs text-gray-500 mt-1">En Mora</p>
            </CardContent>
          </Card>
        </div>

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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Estado por Miembro — {grupoActivo?.nombre}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {balances.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Sin movimientos aún.</p>
              ) : (
                <div className="space-y-3">
                  {balances.map((row) => {
                    const estado = getEstado(row.balance);
                    const memberInfo = grupoActivo?.miembros.find((m) => m.id === row.socioId);
                    const esMiembro = row.socioId === user?.id;

                    return (
                      <div
                        key={row.socioId}
                        className={`p-4 border rounded-xl ${
                          esMiembro ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm">{row.nombre}</p>
                              {memberInfo?.rol === 'ADMIN' && (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-blue-200 bg-blue-50 text-blue-700"
                                >
                                  Admin
                                </Badge>
                              )}
                              {esMiembro && (
                                <Badge variant="secondary" className="text-xs">
                                  Tú
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {memberInfo?.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <EstadoBadge estado={estado} />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">Cuota</p>
                            <p className="font-medium">{formatCurrency(row.objetivo)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Aportó</p>
                            <p className="font-medium text-green-700">
                              {formatCurrency(row.aportado)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Balance</p>
                            <p
                              className={`font-bold ${
                                row.balance > 0
                                  ? 'text-blue-700'
                                  : row.balance < 0
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                              }`}
                            >
                              {row.balance > 0 ? '+' : ''}
                              {formatCurrency(row.balance)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Datos bancarios */}
        <Card className="bg-blue-50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-900">Datos para Transferencias</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1 text-sm">
            <p>
              <span className="font-medium text-blue-800">CBU:</span>{' '}
              <span className="font-mono text-xs text-blue-700">{grupoActivo?.cbu ?? '—'}</span>
            </p>
            <p>
              <span className="font-medium text-blue-800">Alias:</span>{' '}
              <span className="text-blue-700">{grupoActivo?.alias ?? '—'}</span>
            </p>
            <p>
              <span className="font-medium text-blue-800">Titular:</span>{' '}
              <span className="text-blue-700">{grupoActivo?.titular ?? '—'}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modal: elegir mes/año para descargar reporte PDF */}
      <Dialog open={reporteOpen} onOpenChange={setReporteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Generar Reporte PDF</DialogTitle>
            <DialogDescription>
              Elegí el mes y año del reporte que querés descargar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Mes</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={reporteMes}
                  onChange={e => setReporteMes(Number(e.target.value))}
                >
                  {['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
                    .map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Año</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={reporteAnio}
                  onChange={e => setReporteAnio(Number(e.target.value))}
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
              onClick={handleDescargarReporte}
              disabled={descargando}
            >
              {descargando
                ? <><Loader2 className="size-4 animate-spin" />Generando...</>
                : <><FileDown className="size-4" />Descargar PDF</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
