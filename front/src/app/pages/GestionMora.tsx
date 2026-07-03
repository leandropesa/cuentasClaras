import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Bell, Calendar, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { useAuth } from '../context/AuthContext';
import { moraService, type MoraNotification } from '../../services/moraService';
import { MoraStatusBadge } from '../components/MoraStatusBadge';
import { toast } from 'sonner';

export function GestionMora() {
  const navigate = useNavigate();
  const { grupoActivo } = useAuth();

  const [morosos, setMorosos]     = useState<MoraNotification[]>([]);
  const [loading, setLoading]     = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [dueDates, setDueDates]   = useState<Record<number, string>>({});

  useEffect(() => {
    if (!grupoActivo) return;
    moraService.getMiembrosEnMora(Number(grupoActivo.id))
      .then(setMorosos)
      .catch(() => toast.error('Error al cargar morosos'))
      .finally(() => setLoading(false));
  }, [grupoActivo]);

  const handleNotificar = async () => {
    if (!grupoActivo) return;
    setNotifying(true);
    try {
      const pendientes = await moraService.notificarAdmin(Number(grupoActivo.id));
      if (pendientes.length > 0) {
        toast.success(`${pendientes.length} miembro(s) marcado(s) como notificados`);
      } else {
        toast.info('No hay morosos pendientes de notificación');
      }
      const updated = await moraService.getMiembrosEnMora(Number(grupoActivo.id));
      setMorosos(updated);
    } catch {
      toast.error('Error al notificar');
    } finally {
      setNotifying(false);
    }
  };

  const handleSetDueDate = async (userId: number) => {
    if (!grupoActivo) return;
    const fecha = dueDates[userId];
    if (!fecha) {
      toast.error('Ingresá una fecha de vencimiento');
      return;
    }
    try {
      await moraService.setFechaVencimiento(Number(grupoActivo.id), userId, fecha);
      toast.success('Fecha de vencimiento actualizada');
    } catch {
      toast.error('Error al actualizar la fecha');
    }
  };

  if (!grupoActivo) {
    return (
      <Layout title="Gestión de Mora">
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <p className="text-gray-500 text-sm">Seleccioná un grupo primero.</p>
          <Button onClick={() => navigate('/mis-grupos')}>Ir a Mis Grupos</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gestión de Mora">
      <div className="space-y-4 pb-28">

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/inicio')}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <Badge variant="outline" className="text-xs">
            {grupoActivo.nombre}
          </Badge>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                Miembros en mora
                {!loading && (
                  <Badge variant="destructive" className="ml-1">
                    {morosos.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                Miembros que superaron la fecha de vencimiento con saldo negativo.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNotificar}
              disabled={notifying || morosos.length === 0}
              className="gap-2 shrink-0"
            >
              <Bell className="h-4 w-4" />
              {notifying ? 'Notificando...' : 'Notificar pendientes'}
            </Button>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Cargando...</p>
            ) : morosos.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">No hay miembros en mora. Todo en orden ✓</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Miembro</TableHead>
                    <TableHead>Deuda</TableHead>
                    <TableHead>En mora desde</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Notificado</TableHead>
                    <TableHead>Fecha venc.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {morosos.map((m) => (
                    <TableRow key={m.userId}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{m.userName}</p>
                          <p className="text-xs text-muted-foreground">{m.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-red-700 font-semibold">
                        ${m.deuda.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-sm">{m.moraDesdeFecha ?? '-'}</TableCell>
                      <TableCell className="text-sm">{m.diasEnMora}</TableCell>
                      <TableCell>
                        {m.adminNotificado ? (
                          <span className="flex items-center gap-1 text-green-700 text-xs font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Sí
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400 text-xs">
                            <Clock className="h-3.5 w-3.5" /> Pendiente
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            className="h-8 w-36 text-xs"
                            value={dueDates[m.userId] ?? m.fechaVencimiento ?? ''}
                            onChange={(e) =>
                              setDueDates((prev) => ({ ...prev, [m.userId]: e.target.value }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 gap-1"
                            onClick={() => handleSetDueDate(m.userId)}
                          >
                            <Calendar className="h-3 w-3" />
                            Guardar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}