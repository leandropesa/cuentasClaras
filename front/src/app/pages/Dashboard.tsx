import { Layout } from '../components/Layout';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Loader2,
  CalendarClock,
  Upload,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  Copy,
  X,
  Wrench,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useRef, useCallback } from 'react';
import { apiFetch, getAccessToken, API_BASE_URL } from '../../services/apiClient';
import { toast } from 'sonner';
import { moraService, type MoraNotification } from '../../services/moraService';
import { MoraBanner } from '../components/MoraBanner';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface BalanceRow {
  socioId: string;
  nombre: string;
  aportado: number;
  pagado: number;
  objetivo: number;
  balance: number;
}

interface ExpenseDto {
  id: string;
  grupoId: string;
  descripcion: string;
  monto: number;
  categoria: string;
  fecha: string;
  cargadoPor: string;
  tipoGasto: 'FIJO' | 'EXTRAORDINARIO';
}

interface DashboardData {
  totalGastos: number;
  totalPagos: number;
  miembros: number;
  balances: BalanceRow[];
  movimientos: {
    id: string;
    tipo: string;
    descripcion: string;
    monto: number;
    fecha: string;
    tipoGasto?: string;
  }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function proximoVencimiento(): string {
  const hoy = new Date();
  let anio  = hoy.getFullYear();
  let mes   = hoy.getMonth();

  if (hoy.getDate() >= 12) {
    mes += 1;
    if (mes > 11) { mes = 0; anio += 1; }
  }

  return new Date(anio, mes, 12).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
  }).format(n ?? 0);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

// ── Componente ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const navigate              = useNavigate();
  const { user, grupoActivo } = useAuth();

  const [data,    setData]    = useState<DashboardData | null>(null);
  const [gastos,  setGastos]  = useState<ExpenseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [mora,    setMora]    = useState<MoraNotification | null>(null);

  // Modal pago
  const [pagoOpen,     setPagoOpen]     = useState(false);
  const [montoIngreso, setMontoIngreso] = useState('');
  const [comprobante,  setComprobante]  = useState<File | null>(null);
  const [previewUrl,   setPreviewUrl]   = useState<string | null>(null);
  const [enviandoPago, setEnviandoPago] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
  }, [user, navigate]);

  // ── Carga de datos ────────────────────────────────────────────────────────

  const cargarDatos = useCallback(() => {
    if (!grupoActivo) return;
    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch<DashboardData>(`/api/dashboard/${grupoActivo.id}`),
      apiFetch<ExpenseDto[]>(`/api/gastos/${grupoActivo.id}`),
    ])
      .then(([dash, exp]) => { setData(dash); setGastos(exp); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [grupoActivo]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);
  useEffect(() => {
  if (!grupoActivo) return;
  moraService.getMiEstado(Number(grupoActivo.id))
    .then(setMora)
    .catch(() => setMora(null));
  }, [grupoActivo]);

  if (!user) return null;

  // ── Datos derivados ───────────────────────────────────────────────────────
  //
  // La fuente de verdad es BalanceRow.balance (= ConsortiumMember.balance en DB):
  //   > 0  → aportó más de lo que le corresponde → crédito a favor
  //   < 0  → debe aportar → en mora → mostrar botón pagar
  //   = 0  → al día

  const miFila     = data?.balances.find(b => b.socioId === user.id);
  const miBalance  = miFila?.balance ?? 0;
  const miCuota    = miFila?.objetivo ?? 0;
  const miDeuda    = miBalance < 0 ? Math.abs(miBalance) : 0;
  const miCredito  = miBalance > 0 ? miBalance : 0;
  const estaAlDia  = miBalance >= 0;
  const tieneDeuda = miBalance < 0;

  const gastosFijos = gastos.filter(g => g.tipoGasto === 'FIJO');
  const gastosExtra = gastos.filter(g => g.tipoGasto === 'EXTRAORDINARIO');
  const totalFijos  = gastosFijos.reduce((s, g) => s + g.monto, 0);
  const totalExtra  = gastosExtra.reduce((s, g) => s + g.monto, 0);

  const vencimiento = proximoVencimiento();

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAbrirPago = () => {
    setMontoIngreso(miDeuda > 0 ? miDeuda.toFixed(2) : '');
    setPagoOpen(true);
  };

  const handleCerrarModal = () => {
    setPagoOpen(false);
    setComprobante(null);
    setPreviewUrl(null);
    setMontoIngreso('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setComprobante(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCopiar = (valor: string, etiqueta: string) => {
    navigator.clipboard.writeText(valor).then(() => toast.success(`${etiqueta} copiado`));
  };

  const handleEnviarPago = async () => {
    if (!comprobante) {
      toast.error('Adjuntá el comprobante primero');
      return;
    }

    const montoNum = parseFloat(montoIngreso);
    if (!montoIngreso || isNaN(montoNum) || montoNum <= 0) {
      toast.error('Ingresá un monto válido');
      return;
    }

    if (!grupoActivo) return;

    setEnviandoPago(true);
    try {
      // Paso 1: registrar el pago (sin acreditar el balance aún)
      const payment = await apiFetch<{ id: string }>('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupoId: grupoActivo.id, monto: montoNum }),
      });

      // Paso 2: adjuntar el comprobante al pago
      const formData = new FormData();
      formData.append('file', comprobante);
      const token = getAccessToken();
      const uploadRes = await fetch(
        `${API_BASE_URL}/api/comprobantes/pago/${payment.id}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData }
      );
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message || 'Error al subir el comprobante');
      }

      toast.success('Pago enviado — pendiente de validación', {
        description: 'El administrador revisará tu comprobante.',
      });

      handleCerrarModal();
      // No recargamos datos: el balance no cambia hasta que el admin apruebe

    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar el pago');
    } finally {
      setEnviandoPago(false);
    }
  };

  // ── Sin grupo ─────────────────────────────────────────────────────────────

  if (!grupoActivo) {
    return (
      <Layout title="Inicio">
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <CalendarClock className="size-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">Seleccioná un grupo para ver tu resumen.</p>
          <Button onClick={() => navigate('/mis-grupos')}>Ir a Mis Grupos</Button>
        </div>
      </Layout>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout title="Inicio">
      <div className="space-y-4 pb-28">
      {mora && <MoraBanner mora={mora} />}
      
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-gray-300" />
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 text-red-600 text-sm">{error}</CardContent>
          </Card>
        )}

        {!loading && (
          <>
            {/* ── CARD PRINCIPAL ── */}
            <Card className={`overflow-hidden border-0 shadow-md ${
              estaAlDia
                ? 'bg-gradient-to-br from-slate-900 to-slate-800'
                : 'bg-gradient-to-br from-slate-900 to-red-950'
            }`}>
              <CardContent className="pt-6 pb-6 px-5">

                <div className="flex items-center justify-between mb-5">
                  <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">
                    {grupoActivo.nombre}
                  </span>
                  {estaAlDia ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs gap-1">
                      <CheckCircle2 className="size-3" />
                      Al día
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                      Pendiente
                    </Badge>
                  )}
                </div>

                <div className="mb-5">
                  <p className="text-slate-400 text-sm mb-1">
                    {tieneDeuda ? 'A pagar' : miCredito > 0 ? 'Crédito a tu favor' : 'Situación actual'}
                  </p>

                  {tieneDeuda ? (
                    <>
                      <p className="text-white font-bold text-5xl tracking-tight leading-none">
                        {formatCurrency(miDeuda)}
                      </p>
                      <p className="text-slate-400 text-xs mt-1.5">
                        Cuota del período: {formatCurrency(miCuota)}
                      </p>
                    </>
                  ) : miCredito > 0 ? (
                    <>
                      <p className="text-emerald-400 font-bold text-5xl tracking-tight leading-none">
                        {formatCurrency(miCredito)}
                      </p>
                      <p className="text-emerald-500/70 text-xs mt-1.5">
                        Aportaste más de tu cuota · se acredita al siguiente período
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-white font-bold text-5xl tracking-tight leading-none">
                        $0
                      </p>
                      <p className="text-slate-400 text-xs mt-1.5">Estás al día ✓</p>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-5">
                  <CalendarClock className="size-4 text-slate-400 shrink-0" />
                  <span className="text-slate-400 text-sm">
                    Próximo vencimiento:{' '}
                    <span className="text-white font-semibold">{vencimiento}</span>
                  </span>
                </div>

                {tieneDeuda && (
                  <Button
                    className="w-full bg-white text-slate-900 hover:bg-slate-100 font-semibold h-11"
                    onClick={handleAbrirPago}
                  >
                    Pagar {formatCurrency(miDeuda)}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* ── GASTOS DEL PERÍODO ── */}
            {data && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-base">Expensas del período</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                        <TrendingDown className="size-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">Gastos fijos</p>
                        <p className="text-xs text-gray-400 mt-0.5">{gastosFijos.length} ítems</p>
                      </div>
                    </div>
                    <p className="font-semibold text-blue-700">{formatCurrency(totalFijos)}</p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
                        <Sparkles className="size-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">Gastos extraordinarios</p>
                        <p className="text-xs text-gray-400 mt-0.5">{gastosExtra.length} ítems</p>
                      </div>
                    </div>
                    <p className="font-semibold text-orange-600">{formatCurrency(totalExtra)}</p>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t">
                    <span className="text-sm font-semibold">Total del período</span>
                    <span className="font-bold">{formatCurrency(totalFijos + totalExtra)}</span>
                  </div>
                  {data.miembros > 0 && (
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>Por miembro ({data.miembros} personas)</span>
                      <span className="font-medium text-gray-600">
                        {formatCurrency((totalFijos + totalExtra) / data.miembros)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── ÚLTIMOS MOVIMIENTOS ── */}
            {data && data.movimientos.length > 0 && (
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-base">Últimos movimientos</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-400 h-7 px-2"
                      onClick={() => navigate('/resumen-gastos')}
                    >
                      Ver todos →
                    </Button>
                  </div>
                  <div className="space-y-0">
                    {data.movimientos.slice(0, 5).map(mov => (
                      <div
                        key={mov.id}
                        className="flex items-center justify-between py-2.5 border-b last:border-0"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            mov.tipoGasto === 'FIJO' ? 'bg-blue-100' : 'bg-orange-100'
                          }`}>
                            {mov.tipoGasto === 'FIJO'
                              ? <TrendingDown className="size-3.5 text-blue-600" />
                              : <Wrench className="size-3.5 text-orange-500" />
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate leading-none">
                              {mov.descripcion}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{formatDate(mov.fecha)}</p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold ml-2 shrink-0">
                          {formatCurrency(mov.monto)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* ── MODAL: PAGAR ── */}
      <Dialog open={pagoOpen} onOpenChange={(open) => !open && handleCerrarModal()}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Realizar pago</DialogTitle>
            <DialogDescription>
              Transferí al consorcio y adjuntá el comprobante. El administrador
              lo revisará y acreditará el pago una vez aprobado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-1">

            {/* Monto editable */}
            <div className="space-y-1.5">
              <Label
                htmlFor="monto-pago"
                className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                Monto a pagar (ARS)
              </Label>
              <input
                id="monto-pago"
                type="number"
                min="0"
                step="0.01"
                value={montoIngreso}
                onChange={(e) => setMontoIngreso(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-2xl font-bold text-slate-900 bg-slate-50 text-center focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="0"
              />
              {miDeuda > 0 && (
                <p className="text-xs text-gray-400 text-center">
                  Deuda actual: {formatCurrency(miDeuda)}{' '}
                  <button
                    type="button"
                    className="text-blue-500 underline"
                    onClick={() => setMontoIngreso(miDeuda.toFixed(2))}
                  >
                    usar este monto
                  </button>
                </p>
              )}
            </div>

            {/* Datos bancarios */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Datos para transferir
              </p>
              {[
                { label: 'CBU',     value: grupoActivo?.cbu ?? '—' },
                { label: 'Alias',   value: grupoActivo?.alias ?? '—' },
                { label: 'Titular', value: grupoActivo?.titular ?? '—' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div>
                    <span className="text-gray-400 text-xs block leading-none">{label}</span>
                    <span className="font-medium text-gray-800 text-sm font-mono">{value}</span>
                  </div>
                  <button
                    onClick={() => handleCopiar(value, label)}
                    className="text-gray-300 hover:text-gray-600 transition-colors p-1 ml-2 shrink-0"
                    title={`Copiar ${label}`}
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Comprobante */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Comprobante de transferencia *
              </Label>

              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={previewUrl}
                    alt="Comprobante"
                    className="w-full max-h-36 object-cover"
                  />
                  <button
                    onClick={() => { setComprobante(null); setPreviewUrl(null); }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                  <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100">
                    <p className="text-xs text-gray-500 truncate">{comprobante?.name}</p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-gray-300 hover:bg-gray-50/80 transition-all"
                >
                  <Upload className="size-5 text-gray-300 mx-auto mb-1.5" />
                  <p className="text-sm text-gray-400">Subir comprobante</p>
                  <p className="text-xs text-gray-300 mt-0.5">PNG, JPG o PDF</p>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCerrarModal}
                disabled={enviandoPago}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleEnviarPago}
                disabled={!comprobante || enviandoPago}
              >
                {enviandoPago ? (
                  <><Loader2 className="size-4 animate-spin mr-2" />Registrando...</>
                ) : (
                  'Confirmar pago'
                )}
              </Button>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}