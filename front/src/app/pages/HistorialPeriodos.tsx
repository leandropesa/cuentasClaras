import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History, ChevronDown, ChevronUp, Lock, LockOpen,
  TrendingUp, TrendingDown, Wallet, Users, AlertCircle, Loader2, FileDown,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { periodService, type PeriodDto } from '../../services/periodService';
import { toast } from 'sonner';
import { getAccessToken, API_BASE_URL } from '../../services/apiClient';

const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function HistorialPeriodos() {
  const navigate = useNavigate();
  const { grupoActivo } = useAuth();
  const isAdmin = grupoActivo?.miRol === 'ADMIN';

  const [periodos, setPeriodos]   = useState<PeriodDto[]>([]);
  const [loading, setLoading]     = useState(true);
  const [cerrando, setCerrando]   = useState(false);
  const [expandido, setExpandido] = useState<number | null>(null);
  const [descargando, setDescargando] = useState<number | null>(null);

  const cargar = () => {
    if (!grupoActivo) return;
    setLoading(true);
    periodService
      .getHistorial(Number(grupoActivo.id))
      .then(setPeriodos)
      .catch(() => toast.error('Error al cargar períodos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!grupoActivo) return;
    cargar();
  }, [grupoActivo]);

  const handleDescargarPdf = async (p: PeriodDto) => {
    setDescargando(p.id);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/api/reports/period/${p.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al generar el PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `periodo-${String(p.mes).padStart(2, '0')}-${p.anio}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al descargar el PDF');
    } finally {
      setDescargando(null);
    }
  };

  const handleCerrar = async () => {
    if (!grupoActivo) return;
    const confirmado = window.confirm(
      '¿Cerrar el período actual?\n\nSe guardarán los balances de todos los miembros y se abrirá un nuevo período.'
    );
    if (!confirmado) return;
    setCerrando(true);
    try {
      await periodService.cerrar(Number(grupoActivo.id));
      toast.success('Período cerrado correctamente', {
        description: 'Se abrió un nuevo período automáticamente.',
      });
      cargar();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cerrar el período');
    } finally {
      setCerrando(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
    }).format(n);

  const formatDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  if (!grupoActivo) {
    return (
      <Layout title="Historial de Períodos">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4 text-yellow-800 text-sm">
            Seleccioná un grupo desde{' '}
            <button className="underline font-medium" onClick={() => navigate('/mis-grupos')}>
              Mis Grupos
            </button>{' '}para ver el historial.
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const periodoActual = periodos.find(p => p.estado === 'ABIERTO');
  const periodosCerrados = periodos.filter(p => p.estado === 'CERRADO');

  return (
    <Layout title="Historial de Períodos">
      <div className="space-y-4 pb-4">

        {/* Período actual */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {periodoActual && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LockOpen className="size-4 text-blue-600" />
                      <CardTitle className="text-base text-blue-800">
                        Período Actual — {MESES[periodoActual.mes]} {periodoActual.anio}
                      </CardTitle>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">ABIERTO</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                        <TrendingDown className="size-3" /> Gastos del período
                      </p>
                      <p className="font-semibold text-red-600">{formatCurrency(periodoActual.totalGastos)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                        <TrendingUp className="size-3" /> Pagos recibidos
                      </p>
                      <p className="font-semibold text-green-600">{formatCurrency(periodoActual.totalPagos)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                        <Wallet className="size-3" /> Fondo al inicio
                      </p>
                      <p className="font-semibold">{formatCurrency(periodoActual.saldoInicialFondo)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-xs text-gray-500 mb-1">Apertura</p>
                      <p className="font-semibold text-sm">{formatDate(periodoActual.fechaApertura)}</p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="pt-1">
                      <div className="flex items-start gap-2 mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertCircle className="size-4 text-yellow-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-700">
                          Al cerrar el período se guarda el estado de cuentas de todos los miembros.
                          Los balances se arrastran al período siguiente.
                        </p>
                      </div>
                      <Button
                        onClick={handleCerrar}
                        disabled={cerrando}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {cerrando ? (
                          <><Loader2 className="size-4 animate-spin mr-2" />Cerrando período...</>
                        ) : (
                          <><Lock className="size-4 mr-2" />Cerrar Período</>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Períodos cerrados */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="size-4" />
                  Períodos Cerrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {periodosCerrados.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-4">
                    Todavía no hay períodos cerrados.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {periodosCerrados.map(p => (
                      <div key={p.id} className="border rounded-lg overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 text-left"
                          onClick={() => setExpandido(expandido === p.id ? null : p.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Lock className="size-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-sm">
                                {MESES[p.mes]} {p.anio}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(p.fechaApertura)} → {formatDate(p.fechaCierre)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-red-500">−{formatCurrency(p.totalGastos)}</p>
                              <p className="text-xs text-green-600">+{formatCurrency(p.totalPagos)}</p>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); handleDescargarPdf(p); }}
                              disabled={descargando === p.id}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                              title="Descargar PDF"
                            >
                              {descargando === p.id
                                ? <Loader2 className="size-4 animate-spin" />
                                : <FileDown className="size-4" />}
                            </button>
                            {expandido === p.id
                              ? <ChevronUp className="size-4 text-gray-400" />
                              : <ChevronDown className="size-4 text-gray-400" />
                            }
                          </div>
                        </button>

                        {expandido === p.id && (
                          <div className="border-t bg-gray-50 p-3 space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-xs text-gray-500">Gastos del período</p>
                                <p className="font-semibold text-red-600">{formatCurrency(p.totalGastos)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Pagos recibidos</p>
                                <p className="font-semibold text-green-600">{formatCurrency(p.totalPagos)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Fondo al inicio</p>
                                <p className="font-semibold">{formatCurrency(p.saldoInicialFondo)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Fondo al cierre</p>
                                <p className="font-semibold">{formatCurrency(p.saldoFinalFondo ?? 0)}</p>
                              </div>
                            </div>

                            {p.snapshots.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-2">
                                  <Users className="size-3" /> Balance de miembros al cierre
                                </p>
                                <div className="space-y-1">
                                  {p.snapshots.map(s => (
                                    <div key={s.userId} className="flex justify-between items-center text-sm">
                                      <span className="text-gray-700">{s.nombreMiembro}</span>
                                      <span className={
                                        s.balanceAlCierre > 0
                                          ? 'text-green-600 font-medium'
                                          : s.balanceAlCierre < 0
                                            ? 'text-red-600 font-medium'
                                            : 'text-gray-500'
                                      }>
                                        {s.balanceAlCierre >= 0 ? '+' : ''}{formatCurrency(s.balanceAlCierre)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
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
