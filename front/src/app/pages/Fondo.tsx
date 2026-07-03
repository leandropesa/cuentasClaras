// front/src/app/pages/Fondo.tsx
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  PlusCircle,
  Copy,
  Check,
  X,
  Upload,
  Loader2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getFundSummary,
  createFundMovement,
  FundSummaryDto,
} from '../../services/fundService';

export function Fondo() {
  const navigate = useNavigate();
  const { grupoActivo } = useAuth();

  const [summary, setSummary] = useState<FundSummaryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Diálogo selección de tipo
  const [tipoMovimientoOpen, setTipoMovimientoOpen] = useState(false);

  // Diálogo ingreso
  const [ingresoOpen, setIngresoOpen] = useState(false);
  const [conceptoIngreso, setConceptoIngreso] = useState('');
  const [montoIngreso, setMontoIngreso] = useState('');
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cargarSummary = useCallback(async () => {
    if (!grupoActivo) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getFundSummary(grupoActivo.id);
      setSummary(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar el fondo');
    } finally {
      setLoading(false);
    }
  }, [grupoActivo]);

  useEffect(() => { cargarSummary(); }, [cargarSummary]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', minimumFractionDigits: 2,
    }).format(n ?? 0);

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast.success('Copiado al portapapeles');
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleSeleccionTipo = (tipo: 'ingreso' | 'egreso') => {
    setTipoMovimientoOpen(false);
    if (tipo === 'egreso') {
      navigate('/cargar-gasto');
    } else {
      setIngresoOpen(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setComprobante(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCerrarIngreso = () => {
    setIngresoOpen(false);
    setComprobante(null);
    setPreviewUrl(null);
    setConceptoIngreso('');
    setMontoIngreso('');
  };

  const handleEnviarIngreso = async () => {
    if (!conceptoIngreso.trim()) {
      toast.error('Ingresá un concepto');
      return;
    }
    const montoNum = parseFloat(montoIngreso);
    if (!montoIngreso || isNaN(montoNum) || montoNum <= 0) {
      toast.error('Ingresá un monto válido');
      return;
    }
    if (!comprobante) {
      toast.error('Adjuntá el comprobante primero');
      return;
    }

    setEnviando(true);
    try {
      await createFundMovement({
        grupoId: grupoActivo!.id,
        tipo: 'INGRESO',
        concepto: conceptoIngreso.trim(),
        monto: montoNum,
      });
      toast.success('Ingreso registrado correctamente');
      handleCerrarIngreso();
      cargarSummary();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar el ingreso');
    } finally {
      setEnviando(false);
    }
  };

  if (!grupoActivo) {
    return (
      <Layout title="Fondo Común">
        <p className="text-center text-gray-500 py-20">
          Seleccioná un grupo desde{' '}
          <button className="underline" onClick={() => navigate('/mis-grupos')}>
            Mis Grupos
          </button>.
        </p>
      </Layout>
    );
  }

  return (
    <Layout title="Fondo Común">

      {/* ── Diálogo: tipo de movimiento ── */}
      <Dialog open={tipoMovimientoOpen} onOpenChange={setTipoMovimientoOpen}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>¿Qué movimiento querés realizar?</DialogTitle>
            <DialogDescription>
              Elegí si querés registrar un ingreso o un egreso al fondo común.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              onClick={() => handleSeleccionTipo('ingreso')}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <TrendingDown className="size-6 text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-green-800">Ingreso</p>
                <p className="text-xs text-green-600 mt-0.5">Plata que entra al fondo</p>
              </div>
            </button>
            <button
              onClick={() => handleSeleccionTipo('egreso')}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <TrendingUp className="size-6 text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-red-800">Egreso</p>
                <p className="text-xs text-red-600 mt-0.5">Gasto que sale del fondo</p>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Diálogo: registrar ingreso ── */}
      <Dialog open={ingresoOpen} onOpenChange={handleCerrarIngreso}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle>Registrar ingreso al fondo</DialogTitle>
            <DialogDescription>
              Completá los datos y adjuntá el comprobante de la transferencia.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-1">

            {/* Concepto y monto */}
            <div className="space-y-2">
              <Label htmlFor="concepto-ingreso">Concepto *</Label>
              <Input
                id="concepto-ingreso"
                placeholder="Ej: Pago expensa Abril — Depto 3A"
                value={conceptoIngreso}
                onChange={(e) => setConceptoIngreso(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monto-ingreso">Monto (ARS) *</Label>
              <Input
                id="monto-ingreso"
                type="number"
                placeholder="18000"
                min="0"
                step="0.01"
                value={montoIngreso}
                onChange={(e) => setMontoIngreso(e.target.value)}
              />
            </div>

            {/* Datos bancarios */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Datos para transferir
              </p>
              {[
                { label: 'CBU',     value: grupoActivo?.cbu ?? '—',     field: 'i-cbu' },
                { label: 'Alias',   value: grupoActivo?.alias ?? '—',   field: 'i-alias' },
                { label: 'Titular', value: grupoActivo?.titular ?? '—', field: 'i-titular' },
              ].map(({ label, value, field }) => (
                <div key={field} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <span className="text-gray-400 text-xs block leading-none">{label}</span>
                    <span className="font-medium text-gray-800 text-sm font-mono">{value}</span>
                  </div>
                  <button onClick={() => handleCopy(value, field)} className="text-gray-300 hover:text-gray-600 transition-colors p-1 ml-2 shrink-0">
                    {copiedField === field
                      ? <Check className="size-3.5 text-green-500" />
                      : <Copy className="size-3.5" />}
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
                  <img src={previewUrl} alt="Comprobante" className="w-full max-h-36 object-cover" />
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
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Acciones */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={handleCerrarIngreso} disabled={enviando}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleEnviarIngreso}
                disabled={!comprobante || enviando}
              >
                {enviando
                  ? <><Loader2 className="size-4 animate-spin mr-2" />Enviando...</>
                  : 'Confirmar ingreso'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Contenido principal ── */}
      <div className="space-y-5 pb-4">

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

        {!loading && summary && (
          <>
            {/* Balance principal */}
            <Card>
              <CardContent className="pt-8 pb-6">
                <div className="text-center space-y-1">
                  <p className="text-sm text-gray-500">Saldo actual</p>
                  <p className={`text-5xl font-bold tracking-tight ${summary.saldo >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {formatCurrency(summary.saldo)}
                  </p>
                  <p className="text-sm text-gray-400">{grupoActivo.nombre}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <ArrowDownCircle className="size-4 text-green-600 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Ingresos (total)</p>
                      <p className="text-sm font-semibold text-green-700">{formatCurrency(summary.totalIngresos)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    <ArrowUpCircle className="size-4 text-red-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Egresos (total)</p>
                      <p className="text-sm font-semibold text-red-600">{formatCurrency(summary.totalEgresos)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botón */}
            <Button className="w-full gap-2" onClick={() => setTipoMovimientoOpen(true)}>
              <PlusCircle className="size-4" />
              Cargar movimiento al fondo
            </Button>

            {/* Movimientos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Movimientos recientes</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {summary.movimientos.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-6">Sin movimientos aún.</p>
                ) : (
                  <div className="space-y-2">
                    {summary.movimientos.map((mov) => (
                      <div key={mov.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${mov.tipo === 'INGRESO' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {mov.tipo === 'INGRESO'
                              ? <ArrowDownCircle className="size-4 text-green-600" />
                              : <ArrowUpCircle className="size-4 text-red-500" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-tight">{mov.concepto}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDate(mov.fecha)}
                              {mov.registradoPor && ` · ${mov.registradoPor}`}
                            </p>
                          </div>
                        </div>
                        <p className={`font-semibold text-sm shrink-0 ${mov.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-500'}`}>
                          {mov.tipo === 'INGRESO' ? '+' : '-'}{formatCurrency(mov.monto)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Datos de la cuenta — siempre visible */}
        <Card className="border-blue-100 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-blue-900">Datos para transferencias</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {[
              { label: 'CBU',     value: grupoActivo?.cbu ?? '—',     field: 'c-cbu',     mono: true },
              { label: 'Alias',   value: grupoActivo?.alias ?? '—',   field: 'c-alias',   mono: false },
              { label: 'Titular', value: grupoActivo?.titular ?? '—', field: 'c-titular', mono: false },
            ].map(({ label, value, field, mono }) => (
              <div key={field} className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-blue-700 font-medium">{label}</p>
                  <p className={`text-sm text-blue-900 truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
                </div>
                <button onClick={() => handleCopy(value, field)} className="p-1.5 rounded-md hover:bg-blue-100 transition-colors shrink-0">
                  {copiedField === field
                    ? <Check className="size-3.5 text-green-600" />
                    : <Copy className="size-3.5 text-blue-500" />}
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}