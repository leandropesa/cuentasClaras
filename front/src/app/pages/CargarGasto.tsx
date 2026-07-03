import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '../components/ui/select';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Info, Repeat } from 'lucide-react';
import { apiFetch } from '../../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { recurringService } from '../../services/recurringService';

interface ExpenseDto {
  id: string;
  grupoId: string;
  descripcion: string;
  monto: number;
  categoria: string;
  fecha: string;
  cargadoPor: string;
  tipoGasto: 'FIJO' | 'EXTRAORDINARIO';
  subTipo: 'CONVENIO' | 'EN_MOMENTO' | null;
}

const CATEGORIAS = [
  'Mantenimiento', 'Reparaciones', 'Limpieza', 'Seguridad',
  'Servicios', 'Impuestos', 'Mejoras', 'Personal', 'Expensas', 'Otros',
];

export function CargarGasto() {
  const navigate = useNavigate();
  const { user, grupoActivo } = useAuth();
  const isAdmin = grupoActivo?.miRol === 'ADMIN';

  const [formData, setFormData] = useState({
    titulo:    '',
    monto:     '',
    fecha:     new Date().toISOString().split('T')[0],
    categoria: '',
    notas:     '',
    tipoGasto: isAdmin ? '' : 'EXTRAORDINARIO',
    subTipo:   'CONVENIO',  // default para extraordinario
  });
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [gastos, setGastos] = useState<ExpenseDto[]>([]);
  const [loadingGastos, setLoadingGastos] = useState(false);

  const cargarGastos = () => {
    if (!grupoActivo) return;
    setLoadingGastos(true);
    apiFetch<ExpenseDto[]>(`/api/gastos/${grupoActivo.id}`)
      .then(setGastos)
      .catch(console.error)
      .finally(() => setLoadingGastos(false));
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
  }, [user, navigate]);

  useEffect(() => { cargarGastos(); }, [grupoActivo]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      tipoGasto: isAdmin ? prev.tipoGasto : 'EXTRAORDINARIO',
    }));
  }, [isAdmin]);

  const handleTipoGastoChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      tipoGasto: value,
      subTipo: value === 'FIJO' ? '' : (prev.subTipo || 'CONVENIO'),
    }));
    if (value !== 'FIJO') setEsRecurrente(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo || !formData.monto || !formData.categoria || !formData.tipoGasto) {
      toast.error('Completá todos los campos obligatorios');
      return;
    }
    if (formData.tipoGasto === 'EXTRAORDINARIO' && !formData.subTipo) {
      toast.error('Seleccioná si el gasto es por convenio o para pagar en el momento');
      return;
    }
    const montoNumerico = parseFloat(formData.monto);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    if (!grupoActivo) {
      toast.error('Seleccioná un grupo antes de cargar un gasto');
      return;
    }

    setEnviando(true);
    try {
      await apiFetch<ExpenseDto>('/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupoId:     grupoActivo.id,
          descripcion: formData.titulo,
          monto:       montoNumerico,
          categoria:   formData.categoria.toUpperCase().replace(/ /g, '_'),
          fecha:       formData.fecha,
          cargadoPor:  user?.id ?? '',
          tipoGasto:   formData.tipoGasto,
          subTipo:     formData.tipoGasto === 'EXTRAORDINARIO' ? formData.subTipo : null,
        }),
      });

      if (esRecurrente && formData.tipoGasto === 'FIJO') {
        try {
          await recurringService.crear(
            grupoActivo.id,
            formData.titulo,
            montoNumerico,
            formData.categoria,
          );
          toast.success('Gasto registrado + plantilla recurrente creada', {
            description: `${formData.titulo} se aplicará automáticamente cada mes.`,
          });
        } catch {
          toast.success('Gasto registrado', {
            description: `${formData.titulo} — $${montoNumerico.toLocaleString('es-AR')}`,
          });
          toast.warning('No se pudo crear la plantilla recurrente. Podés hacerlo desde "Recurrentes".');
        }
      } else {
        toast.success('Gasto registrado', {
          description: `${formData.titulo} — $${montoNumerico.toLocaleString('es-AR')}`,
        });
      }

      setFormData({
        titulo:    '',
        monto:     '',
        fecha:     new Date().toISOString().split('T')[0],
        categoria: '',
        notas:     '',
        tipoGasto: isAdmin ? '' : 'EXTRAORDINARIO',
        subTipo:   'CONVENIO',
      });
      setEsRecurrente(false);
      cargarGastos();

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el gasto';
      if (msg.includes('Saldo insuficiente')) {
        toast.error('Fondo insuficiente', {
          description: msg,
          action: {
            label: 'Cargar plata al fondo',
            onClick: () => navigate('/fondo'),
          },
          duration: 8000,
        });
      } else if (msg.toLowerCase().includes('mora')) {
        toast.error('Cuenta en mora', {
          description: msg,
          duration: 8000,
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setEnviando(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', minimumFractionDigits: 0,
    }).format(n);

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  if (!user) return null;

  return (
    <Layout title="Cargar Gasto">
      <div className="space-y-6 pb-4">

        {!grupoActivo && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4 text-yellow-800 text-sm">
              Seleccioná un grupo desde{' '}
              <button className="underline font-medium" onClick={() => navigate('/mis-grupos')}>
                Mis Grupos
              </button>{' '}para cargar un gasto.
            </CardContent>
          </Card>
        )}

        {grupoActivo && (
          <Card>
            <CardHeader>
              <CardTitle>Nuevo Gasto — {grupoActivo.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Tipo de Gasto */}
                <div className="space-y-2">
                  <Label>Tipo de Gasto *</Label>
                  {isAdmin ? (
                    <Select value={formData.tipoGasto} onValueChange={handleTipoGastoChange}>
                      <SelectTrigger><SelectValue placeholder="Seleccioná el tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIJO">Fijo / Expensa mensual</SelectItem>
                        <SelectItem value="EXTRAORDINARIO">Extraordinario</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        EXTRAORDINARIO
                      </Badge>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Info className="size-3" />
                        Los gastos fijos solo los puede cargar el administrador
                      </span>
                    </div>
                  )}
                </div>

                {/* Opción recurrente — solo para FIJO */}
                {formData.tipoGasto === 'FIJO' && (
                  <button
                    type="button"
                    onClick={() => setEsRecurrente(r => !r)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      esRecurrente
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Repeat className={`size-4 shrink-0 ${esRecurrente ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                      <p className="font-semibold text-sm">Repetir mensualmente</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Crea una plantilla que se aplica automáticamente cada mes
                      </p>
                    </div>
                    <div className={`ml-auto size-4 rounded border-2 shrink-0 flex items-center justify-center ${
                      esRecurrente ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    }`}>
                      {esRecurrente && <svg className="size-2.5 text-white" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </button>
                )}

                {/* Sub-tipo — solo para extraordinario */}
                {formData.tipoGasto === 'EXTRAORDINARIO' && (
                  <div className="space-y-2">
                    <Label>¿Cómo se paga? *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, subTipo: 'CONVENIO' }))}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          formData.subTipo === 'CONVENIO'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-semibold text-sm">Por convenio</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Se suma a la próxima expensa y se divide entre todos
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, subTipo: 'EN_MOMENTO' }))}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          formData.subTipo === 'EN_MOMENTO'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-semibold text-sm">En el momento</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Se paga ahora del fondo común
                        </p>
                      </button>
                    </div>
                    {formData.subTipo === 'EN_MOMENTO' && (
                      <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                        <Info className="size-3" />
                        El fondo debe tener saldo suficiente para cubrir este gasto
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="titulo">Descripción *</Label>
                  <Input
                    id="titulo"
                    placeholder="Ej: Electricista - Arreglo luz hall"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monto">Monto (ARS) *</Label>
                  <Input
                    id="monto"
                    type="number"
                    placeholder="15000"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(v) => setFormData({ ...formData, categoria: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccioná una categoría" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas (opcional)</Label>
                  <Textarea
                    id="notas"
                    placeholder="Detalles adicionales..."
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/inicio')}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={enviando}>
                    {enviando ? (
                      <><Loader2 className="size-4 animate-spin mr-2" />Guardando...</>
                    ) : 'Confirmar Gasto'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de gastos existentes */}
        <Card>
          <CardHeader><CardTitle>Gastos Registrados</CardTitle></CardHeader>
          <CardContent>
            {loadingGastos ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-6 animate-spin text-gray-400" />
              </div>
            ) : gastos.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4">
                {grupoActivo ? 'No hay gastos registrados aún.' : 'Seleccioná un grupo para ver los gastos.'}
              </p>
            ) : (
              <div className="space-y-3">
                {gastos.map((g) => (
                  <div key={g.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-sm truncate">{g.descripcion}</p>
                        <Badge
                          variant="outline"
                          className={
                            g.tipoGasto === 'FIJO'
                              ? 'text-blue-700 border-blue-200 bg-blue-50 text-xs shrink-0'
                              : 'text-orange-700 border-orange-200 bg-orange-50 text-xs shrink-0'
                          }
                        >
                          {g.tipoGasto === 'FIJO' ? 'FIJO' : 'EXTRA'}
                        </Badge>
                        {g.subTipo && (
                          <Badge variant="outline" className="text-xs shrink-0 text-gray-600">
                            {g.subTipo === 'CONVENIO' ? 'Convenio' : 'En el momento'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {g.categoria} · {formatDate(g.fecha)}
                      </p>
                    </div>
                    <p className="font-semibold text-sm ml-3 shrink-0">
                      {formatCurrency(g.monto)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}