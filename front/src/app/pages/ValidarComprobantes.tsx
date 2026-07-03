import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Paperclip,
  Calendar,
  User,
  ExternalLink,
} from 'lucide-react';
import { apiFetch, getAccessToken, API_BASE_URL } from '../../services/apiClient';
import { useAuth } from '../context/AuthContext';
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

export function ValidarComprobantes() {
  const navigate = useNavigate();
  const { grupoActivo } = useAuth();
  const isAdmin = grupoActivo?.miRol === 'ADMIN';

  const [comprobantes, setComprobantes] = useState<ComprobanteDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reject dialog
  const [rejectTarget, setRejectTarget] = useState<ComprobanteDto | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!grupoActivo || !isAdmin) return;
    setLoading(true);
    apiFetch<ComprobanteDto[]>(`/api/comprobantes/pendientes/${grupoActivo.id}`)
      .then(setComprobantes)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [grupoActivo, isAdmin]);

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleApprove = async (c: ComprobanteDto) => {
    setSubmitting(true);
    try {
      await apiFetch<ComprobanteDto>(`/api/comprobantes/${c.id}/aprobar`, { method: 'POST' });
      setComprobantes((prev) => prev.filter((x) => x.id !== c.id));
      toast.success('Comprobante aprobado.');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al aprobar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setSubmitting(true);
    try {
      await apiFetch<ComprobanteDto>(`/api/comprobantes/${rejectTarget.id}/rechazar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: rejectMotivo }),
      });
      setComprobantes((prev) => prev.filter((x) => x.id !== rejectTarget.id));
      toast.success('Comprobante rechazado.');
      setRejectTarget(null);
      setRejectMotivo('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al rechazar');
    } finally {
      setSubmitting(false);
    }
  };

  const openFile = (comprobanteId: string) => {
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
      <Layout title="Validar Comprobantes">
        <p className="text-center text-gray-500 py-20">
          Seleccioná un grupo desde{' '}
          <button className="underline" onClick={() => navigate('/mis-grupos')}>
            Mis Grupos
          </button>.
        </p>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout title="Validar Comprobantes">
        <p className="text-center text-gray-500 py-20">
          Solo el administrador puede acceder a esta sección.
        </p>
      </Layout>
    );
  }

  return (
    <Layout title="Validar Comprobantes">
      {/* Reject dialog */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(o) => {
          if (!o) {
            setRejectTarget(null);
            setRejectMotivo('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar comprobante</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-600">
              Indicá el motivo del rechazo para que el socio pueda corregirlo.
            </p>
            <textarea
              className="w-full border rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="Ej: El archivo está borroso, no se puede leer el monto..."
              value={rejectMotivo}
              onChange={(e) => setRejectMotivo(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectMotivo('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectMotivo.trim() || submitting}
              onClick={handleReject}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <XCircle className="size-4" />
              )}
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
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

        {!loading && !error && comprobantes.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <CheckCircle className="size-12 mx-auto mb-3 text-green-400" />
            <p className="font-medium">Todo al día</p>
            <p className="text-sm mt-1">No hay comprobantes pendientes de revisión.</p>
          </div>
        )}

        {!loading && !error && comprobantes.length > 0 && (
          <>
            <p className="text-sm text-gray-500">
              {comprobantes.length} comprobante{comprobantes.length !== 1 ? 's' : ''} pendiente
              {comprobantes.length !== 1 ? 's' : ''} de revisión
            </p>
            {comprobantes.map((c) => (
              <Card key={c.id} className="border-amber-200 bg-amber-50/30">
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                          PENDIENTE
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="size-3" />
                          {c.uploadedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          Subido el {formatDate(c.uploadedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Paperclip className="size-3" />
                          {c.fileName} · {formatSize(c.fileSize)}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs gap-1 shrink-0"
                      onClick={() => openFile(c.id)}
                    >
                      <ExternalLink className="size-3" />
                      Ver
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 gap-1 bg-green-600 hover:bg-green-700 text-xs"
                      disabled={submitting}
                      onClick={() => handleApprove(c)}
                    >
                      <CheckCircle className="size-3" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 gap-1 text-xs"
                      disabled={submitting}
                      onClick={() => {
                        setRejectTarget(c);
                        setRejectMotivo('');
                      }}
                    >
                      <XCircle className="size-3" />
                      Rechazar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </Layout>
  );
}
