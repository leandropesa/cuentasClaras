import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Loader2,
  PlusCircle,
  AlertTriangle,
  Wallet,
  Calendar,
  Tag,
  User,
  ArrowRight,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Paperclip,
  ExternalLink,
} from 'lucide-react';
import { apiFetch, getAccessToken, API_BASE_URL } from '../../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { getFundSummary } from '../../services/fundService';
import { toast } from 'sonner';

interface ComprobanteDto {
  id: string;
  paymentId: string;
  uploadedBy: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  reviewedBy: string | null;
  rejectionReason: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
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
  subTipo?: 'CONVENIO' | 'EN_MOMENTO';
}

interface PaymentDto {
  id: string;
  grupoId: string;
  socioId: string;
  socioNombre: string;
  monto: number;
  fecha: string;
  comprobante: ComprobanteDto | null;
}

export function ResumenGastos() {
  const navigate = useNavigate();
  const { grupoActivo, user } = useAuth();
  const isAdmin = grupoActivo?.miRol === 'ADMIN';

  const [gastos, setGastos] = useState<ExpenseDto[]>([]);
  const [pagos, setPagos] = useState<PaymentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saldoFondo, setSaldoFondo] = useState<number | null>(null);
  const [fondoInsuficienteGasto, setFondoInsuficienteGasto] = useState<ExpenseDto | null>(null);

  // Upload comprobante dialog
  const [uploadTarget, setUploadTarget] = useState<PaymentDto | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!grupoActivo) return;
    setLoading(true);
    setError(null);

    Promise.all([
      apiFetch<ExpenseDto[]>(`/api/gastos/${grupoActivo.id}`),
      apiFetch<PaymentDto[]>(`/api/pagos/${grupoActivo.id}`),
      getFundSummary(grupoActivo.id),
    ])
      .then(([gastosData, pagosData, fondoData]) => {
        setGastos(gastosData);
        setPagos(pagosData);
        setSaldoFondo(fondoData.saldo);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [grupoActivo]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(n ?? 0);

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const gastosFijos = gastos.filter((g) => g.tipoGasto === 'FIJO');
  const gastosExtraordinarios = gastos.filter((g) => g.tipoGasto === 'EXTRAORDINARIO');
  const totalFijos = gastosFijos.reduce((s, g) => s + g.monto, 0);
  const totalExtraordinarios = gastosExtraordinarios.reduce((s, g) => s + g.monto, 0);

  const puedeCargarDelFondo = (monto: number) =>
    saldoFondo !== null && saldoFondo >= monto;

  const handlePagarGasto = (gasto: ExpenseDto) => {
    if (!puedeCargarDelFondo(gasto.monto)) {
      setFondoInsuficienteGasto(gasto);
    } else {
      alert(`Gasto "${gasto.descripcion}" pagado del fondo.`);
    }
  };

  const handleUploadComprobante = async () => {
    if (!uploadTarget || !uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);

      const token = getAccessToken();
      const response = await fetch(
        `${API_BASE_URL}/api/comprobantes/pago/${uploadTarget.id}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Error al subir el comprobante' }));
        throw new Error(err.message || 'Error al subir el comprobante');
      }
      const comprobanteData: ComprobanteDto = await response.json();
      setPagos((prev) =>
        prev.map((p) =>
          p.id === uploadTarget.id ? { ...p, comprobante: comprobanteData } : p
        )
      );
      toast.success('Comprobante subido. Pendiente de revisión por el administrador.');
      setUploadTarget(null);
      setUploadFile(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al subir el comprobante');
    } finally {
      setUploading(false);
    }
  };

  const openFileInNewTab = (comprobanteId: string) => {
    const token = getAccessToken();
    fetch(`${API_BASE_URL}/api/comprobantes/${comprobanteId}/archivo`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      })
      .catch(() => toast.error('No se pudo abrir el archivo'));
  };

  if (!grupoActivo) {
    return (
      <Layout title="Resumen de Gastos">
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
    <Layout title="Resumen de Gastos">
      {/* Dialog fondo insuficiente */}
      <AlertDialog
        open={!!fondoInsuficienteGasto}
        onOpenChange={(o) => !o && setFondoInsuficienteGasto(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="size-5" />
              Fondos insuficientes
            </AlertDialogTitle>
            <AlertDialogDescription>
              El fondo actual{' '}
              <strong>({formatCurrency(saldoFondo ?? 0)})</strong> no es
              suficiente para cubrir{' '}
              <strong>
                {fondoInsuficienteGasto?.descripcion} (
                {formatCurrency(fondoInsuficienteGasto?.monto ?? 0)})
              </strong>
              . Cargá plata al fondo y volvé a intentarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setFondoInsuficienteGasto(null);
                navigate('/fondo');
              }}
              className="gap-2"
            >
              Ir al Fondo
              <ArrowRight className="size-4" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog upload comprobante */}
      <Dialog
        open={!!uploadTarget}
        onOpenChange={(o) => {
          if (!o) {
            setUploadTarget(null);
            setUploadFile(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir comprobante de pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-600">
              Pago de{' '}
              <strong>{formatCurrency(uploadTarget?.monto ?? 0)}</strong> del{' '}
              {uploadTarget ? formatDate(uploadTarget.fecha) : ''}
            </p>
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadFile ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Paperclip className="size-4 text-gray-500" />
                  <span className="truncate max-w-[200px]">{uploadFile.name}</span>
                  <span className="text-gray-400">
                    ({(uploadFile.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
              ) : (
                <div className="text-sm text-gray-500 space-y-1">
                  <Upload className="size-6 mx-auto text-gray-400" />
                  <p>Hacé clic para seleccionar un archivo</p>
                  <p className="text-xs">PDF, JPEG o PNG · máx. 10 MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,image/jpeg,image/png,application/pdf"
              className="hidden"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadTarget(null);
                setUploadFile(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              disabled={!uploadFile || uploading}
              onClick={handleUploadComprobante}
              className="gap-2"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Subir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-5 pb-4">
        {/* Resumen header */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-gray-500 mb-1">Total Fijos</p>
              <p className="text-2xl font-bold text-blue-800">
                {formatCurrency(totalFijos)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {gastosFijos.length} gasto{gastosFijos.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-gray-500 mb-1">Total Extraordinarios</p>
              <p className="text-2xl font-bold text-orange-700">
                {formatCurrency(totalExtraordinarios)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {gastosExtraordinarios.length} gasto
                {gastosExtraordinarios.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Fondo disponible */}
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-gray-500" />
              <span className="text-sm text-gray-600">Fondo disponible</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-semibold ${
                saldoFondo !== null && saldoFondo < 0 ? 'text-red-600' : 'text-gray-800'
              }`}>
                {saldoFondo !== null ? formatCurrency(saldoFondo) : '—'}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={() => navigate('/fondo')}
              >
                Ver fondo
              </Button>
            </div>
          </CardContent>
        </Card>

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
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Actividad del grupo</h3>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => navigate('/cargar-gasto')}
              >
                <PlusCircle className="size-4" />
                {isAdmin ? 'Nuevo gasto' : 'Cargar extraordinario'}
              </Button>
            </div>

            <Tabs defaultValue="fijos">
              <TabsList className="w-full">
                <TabsTrigger value="fijos" className="flex-1 text-xs">
                  Fijos ({gastosFijos.length})
                </TabsTrigger>
                <TabsTrigger value="extraordinarios" className="flex-1 text-xs">
                  Extra ({gastosExtraordinarios.length})
                </TabsTrigger>
                <TabsTrigger value="pagos" className="flex-1 text-xs">
                  Pagos ({pagos.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="fijos" className="space-y-3 mt-4">
                {gastosFijos.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-8">
                    No hay gastos fijos registrados.
                    {isAdmin && (
                      <span>
                        {' '}
                        <button
                          className="underline text-blue-600"
                          onClick={() => navigate('/cargar-gasto')}
                        >
                          Cargá el primero
                        </button>.
                      </span>
                    )}
                  </p>
                ) : (
                  gastosFijos.map((g) => (
                    <GastoCard key={g.id} gasto={g} formatCurrency={formatCurrency} formatDate={formatDate} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="extraordinarios" className="space-y-3 mt-4">
                {gastosExtraordinarios.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-8">
                    No hay gastos extraordinarios registrados.{' '}
                    <button
                      className="underline text-blue-600"
                      onClick={() => navigate('/cargar-gasto')}
                    >
                      Cargá el primero
                    </button>.
                  </p>
                ) : (
                  gastosExtraordinarios.map((g) => (
                    <GastoCard
                      key={g.id}
                      gasto={g}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      onPagar={
                        isAdmin && g.subTipo === 'EN_MOMENTO'
                          ? () => handlePagarGasto(g)
                          : undefined
                      }
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="pagos" className="space-y-3 mt-4">
                {isAdmin && pagos.some((p) => p.comprobante?.status === 'PENDIENTE') && (
                  <button
                    className="w-full text-left p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm flex items-center justify-between"
                    onClick={() => navigate('/validar-comprobantes')}
                  >
                    <span className="text-amber-800 font-medium flex items-center gap-2">
                      <Clock className="size-4" />
                      Hay comprobantes pendientes de revisión
                    </span>
                    <ArrowRight className="size-4 text-amber-600" />
                  </button>
                )}

                {pagos.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-8">
                    No hay pagos registrados aún.
                  </p>
                ) : (
                  pagos.map((p) => (
                    <PagoCard
                      key={p.id}
                      pago={p}
                      currentUserId={user?.id}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      onSubirComprobante={() => setUploadTarget(p)}
                      onVerComprobante={() => openFileInNewTab(p.comprobante!.id)}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
}

// ── GastoCard ─────────────────────────────────────────────────────────────────

interface GastoCardProps {
  gasto: ExpenseDto;
  formatCurrency: (n: number) => string;
  formatDate: (s: string) => string;
  onPagar?: () => void;
}

function GastoCard({ gasto, formatCurrency, formatDate, onPagar }: GastoCardProps) {
  const isFijo = gasto.tipoGasto === 'FIJO';
  const subTipoLabel =
    gasto.subTipo === 'CONVENIO'
      ? 'Por convenio'
      : gasto.subTipo === 'EN_MOMENTO'
      ? 'A pagar en el momento'
      : null;

  return (
    <div className="p-4 border rounded-xl bg-white shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-medium text-sm truncate">{gasto.descripcion}</p>
            <Badge
              variant="outline"
              className={
                isFijo
                  ? 'text-blue-700 border-blue-200 bg-blue-50 text-xs'
                  : 'text-orange-700 border-orange-200 bg-orange-50 text-xs'
              }
            >
              {isFijo ? 'FIJO' : 'EXTRA'}
            </Badge>
            {subTipoLabel && (
              <Badge variant="secondary" className="text-xs">
                {subTipoLabel}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Tag className="size-3" />
              {gasto.categoria}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {formatDate(gasto.fecha)}
            </span>
            <span className="flex items-center gap-1">
              <User className="size-3" />
              {gasto.cargadoPor}
            </span>
          </div>
        </div>
        <p className="font-bold text-base shrink-0">{formatCurrency(gasto.monto)}</p>
      </div>
      {onPagar && (
        <div className="pt-2 border-t">
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={onPagar}>
            Pagar del fondo
          </Button>
        </div>
      )}
    </div>
  );
}

// ── PagoCard ──────────────────────────────────────────────────────────────────

interface PagoCardProps {
  pago: PaymentDto;
  currentUserId?: string;
  formatCurrency: (n: number) => string;
  formatDate: (s: string) => string;
  onSubirComprobante: () => void;
  onVerComprobante: () => void;
}

function PagoCard({
  pago,
  currentUserId,
  formatCurrency,
  formatDate,
  onSubirComprobante,
  onVerComprobante,
}: PagoCardProps) {
  const comprobante = pago.comprobante;
  const isOwner = pago.socioId === currentUserId;
  const canUpload =
    isOwner &&
    (!comprobante || comprobante.status === 'RECHAZADO');

  const statusBadge = comprobante ? (
    comprobante.status === 'APROBADO' ? (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs gap-1">
        <CheckCircle className="size-3" /> Aprobado
      </Badge>
    ) : comprobante.status === 'RECHAZADO' ? (
      <Badge className="bg-red-100 text-red-700 border-red-200 text-xs gap-1">
        <XCircle className="size-3" /> Rechazado
      </Badge>
    ) : (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs gap-1">
        <Clock className="size-3" /> Pendiente
      </Badge>
    )
  ) : null;

  return (
    <div className="p-4 border rounded-xl bg-white shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-medium text-sm">{pago.socioNombre}</p>
            {statusBadge}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {formatDate(pago.fecha)}
            </span>
            {comprobante && (
              <span className="flex items-center gap-1">
                <Paperclip className="size-3" />
                {comprobante.fileName}
              </span>
            )}
          </div>
          {comprobante?.status === 'RECHAZADO' && comprobante.rejectionReason && (
            <p className="text-xs text-red-600 mt-1 bg-red-50 rounded px-2 py-1">
              Motivo: {comprobante.rejectionReason}
            </p>
          )}
        </div>
        <p className="font-bold text-base shrink-0">{formatCurrency(pago.monto)}</p>
      </div>

      {(canUpload || comprobante) && (
        <div className="pt-2 border-t flex gap-2">
          {canUpload && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs gap-1"
              onClick={onSubirComprobante}
            >
              <Upload className="size-3" />
              {comprobante?.status === 'RECHAZADO' ? 'Reintentar' : 'Subir comprobante'}
            </Button>
          )}
          {comprobante && (
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 text-xs gap-1"
              onClick={onVerComprobante}
            >
              <ExternalLink className="size-3" />
              Ver archivo
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
