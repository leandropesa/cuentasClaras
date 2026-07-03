import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Repeat, Play, Power, Pencil, Check, X, Plus, Loader2, Info,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { useAuth } from '../context/AuthContext';
import {
  recurringService,
  lastGeneratedLabel,
  type RecurringTemplateDto,
} from '../../services/recurringService';
import { toast } from 'sonner';

const CATEGORIAS = [
  'Mantenimiento', 'Reparaciones', 'Limpieza', 'Seguridad',
  'Servicios', 'Impuestos', 'Mejoras', 'Personal', 'Expensas', 'Otros',
];

export function GastosRecurrentes() {
  const navigate = useNavigate();
  const { grupoActivo } = useAuth();
  const isAdmin = grupoActivo?.miRol === 'ADMIN';

  const [plantillas, setPlantillas] = useState<RecurringTemplateDto[]>([]);
  const [loading, setLoading]       = useState(true);

  // formulario nuevo
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState({ descripcion: '', monto: '', categoria: '' });
  const [guardando, setGuardando]   = useState(false);

  // edición de monto inline
  const [editandoId, setEditandoId]   = useState<number | null>(null);
  const [montoEdit, setMontoEdit]     = useState('');
  const [savingMonto, setSavingMonto] = useState(false);

  // aplicar manualmente
  const [aplicandoId, setAplicandoId]   = useState<number | null>(null);

  const cargar = () => {
    if (!grupoActivo) return;
    setLoading(true);
    recurringService
      .listar(Number(grupoActivo.id))
      .then(setPlantillas)
      .catch(() => toast.error('Error al cargar plantillas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [grupoActivo]);

  if (!isAdmin) {
    return (
      <Layout title="Gastos Recurrentes">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4 text-yellow-800 text-sm">
            Solo los administradores pueden gestionar gastos recurrentes.
          </CardContent>
        </Card>
      </Layout>
    );
  }

  if (!grupoActivo) {
    return (
      <Layout title="Gastos Recurrentes">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4 text-yellow-800 text-sm">
            Seleccioná un grupo desde{' '}
            <button className="underline font-medium" onClick={() => navigate('/mis-grupos')}>
              Mis Grupos
            </button>.
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(form.monto);
    if (!form.descripcion || !form.categoria || isNaN(montoNum) || montoNum <= 0) {
      toast.error('Completá todos los campos');
      return;
    }
    setGuardando(true);
    try {
      await recurringService.crear(grupoActivo.id, form.descripcion, montoNum, form.categoria);
      toast.success('Plantilla creada', {
        description: 'Se aplicará automáticamente el 1° de cada mes.',
      });
      setForm({ descripcion: '', monto: '', categoria: '' });
      setShowForm(false);
      cargar();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la plantilla');
    } finally {
      setGuardando(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const updated = await recurringService.toggle(id);
      setPlantillas(ps => ps.map(p => p.id === id ? updated : p));
      toast.success(updated.activo ? 'Plantilla activada' : 'Plantilla desactivada');
    } catch {
      toast.error('Error al cambiar el estado');
    }
  };


  const handleAplicar = async (id: number) => {
    const confirmado = window.confirm('¿Aplicar este gasto ahora?\nSe creará el gasto y se distribuirá entre los miembros.');
    if (!confirmado) return;
    setAplicandoId(id);
    try {
      await recurringService.aplicar(id);
      toast.success('Gasto aplicado correctamente');
      cargar();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al aplicar el gasto');
    } finally {
      setAplicandoId(null);
    }
  };

  const handleSaveMonto = async (id: number) => {
    const m = parseFloat(montoEdit);
    if (isNaN(m) || m <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    setSavingMonto(true);
    try {
      const updated = await recurringService.actualizarMonto(id, m);
      setPlantillas(ps => ps.map(p => p.id === id ? updated : p));
      setEditandoId(null);
      toast.success('Monto actualizado');
    } catch {
      toast.error('Error al actualizar el monto');
    } finally {
      setSavingMonto(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);

  const activas   = plantillas.filter(p => p.activo);
  const inactivas = plantillas.filter(p => !p.activo);

  return (
    <Layout title="Gastos Recurrentes">
      <div className="space-y-4 pb-4">

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <Info className="size-4 shrink-0 mt-0.5" />
          <p>
            Las plantillas activas generan un gasto fijo automáticamente el <strong>1° de cada mes</strong>,
            distribuyendo el monto según los pesos de cada miembro.
          </p>
        </div>

        {/* Botón nueva plantilla */}
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full gap-2">
            <Plus className="size-4" />
            Nueva plantilla recurrente
          </Button>
        )}

        {/* Formulario nueva plantilla */}
        {showForm && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Repeat className="size-4" /> Nueva Plantilla
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCrear} className="space-y-4">
                <div className="space-y-2">
                  <Label>Descripción *</Label>
                  <Input
                    placeholder="Ej: Luz y gas edificio"
                    value={form.descripcion}
                    onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monto mensual (ARS) *</Label>
                  <Input
                    type="number" min="0" step="0.01"
                    placeholder="45000"
                    value={form.monto}
                    onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccioná una categoría" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={guardando}>
                    {guardando ? <><Loader2 className="size-4 animate-spin mr-2" />Guardando...</> : 'Crear Plantilla'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista plantillas activas */}
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-gray-400" /></div>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Plantillas Activas ({activas.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {activas.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No hay plantillas activas.</p>
                ) : (
                  <div className="space-y-3">
                    {activas.map(p => (
                      <div key={p.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{p.descripcion}</p>
                            <p className="text-xs text-gray-500">{p.categoria} · Última vez: {lastGeneratedLabel(p)}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700 border-green-200 shrink-0">Activa</Badge>
                        </div>

                        {/* Monto editable */}
                        {editandoId === p.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number" min="0" step="0.01"
                              value={montoEdit}
                              onChange={e => setMontoEdit(e.target.value)}
                              className="h-8 text-sm"
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => handleSaveMonto(p.id)} disabled={savingMonto}>
                              {savingMonto ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditandoId(null)}>
                              <X className="size-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">{formatCurrency(p.monto)}/mes</span>
                            <button
                              className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                              onClick={() => { setEditandoId(p.id); setMontoEdit(String(p.monto)); }}
                            >
                              <Pencil className="size-3" /> Editar monto
                            </button>
                          </div>
                        )}

                        {/* Acciones */}
                        <div className="flex gap-2 pt-1 flex-wrap">
                          <Button
                            size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1"
                            onClick={() => handleAplicar(p.id)}
                            disabled={aplicandoId === p.id}
                          >
                            {aplicandoId === p.id
                              ? <><Loader2 className="size-3 animate-spin" />Aplicando...</>
                              : <><Play className="size-3" />Aplicar ahora</>
                            }
                          </Button>
                          <Button
                            size="sm" variant="outline"
                            className="w-full h-8 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleToggle(p.id)}
                          >
                            <Power className="size-3" />Desactivar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plantillas inactivas (colapsadas) */}
            {inactivas.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-gray-500">Inactivas ({inactivas.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {inactivas.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2 border rounded-lg bg-gray-50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-500 truncate">{p.descripcion}</p>
                          <p className="text-xs text-gray-400">{formatCurrency(p.monto)}/mes · {p.categoria}</p>
                        </div>
                        <Button
                          size="sm" variant="outline" className="h-8 text-xs gap-1 shrink-0 ml-2"
                          onClick={() => handleToggle(p.id)}
                        >
                          <Power className="size-3" />Activar
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
