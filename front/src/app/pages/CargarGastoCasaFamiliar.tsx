import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CasaFamiliarLayout } from '../components/CasaFamiliarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../services/apiClient';
import { useAuth } from '../context/AuthContext';

const CATEGORIAS = [
    'Servicios', 'Mantenimiento', 'Reparaciones', 'Limpieza',
    'Impuestos', 'Compras', 'Mejoras', 'Otros',
];

export function CargarGastoCasaFamiliar() {
    const { id }     = useParams<{ id: string }>();
    const navigate   = useNavigate();
    const { user }   = useAuth();

    const [form, setForm] = useState({
        descripcion: '',
        monto:       '',
        categoria:   '',
        fecha:       new Date().toISOString().split('T')[0],
    });
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.descripcion.trim()) { toast.error('Ingresá una descripción'); return; }
        if (!form.monto || isNaN(Number(form.monto)) || Number(form.monto) <= 0) {
            toast.error('Ingresá un monto válido'); return;
        }
        if (!form.categoria) { toast.error('Seleccioná una categoría'); return; }
        if (!user) return;

        setEnviando(true);
        try {
            await apiFetch(`/api/family-homes/${id}/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    familyHomeId: Number(id),
                    descripcion:  form.descripcion.trim(),
                    monto:        Number(form.monto),
                    categoria:    form.categoria,
                    fecha:        form.fecha,
                    cargadoPor:   user.nombre ?? user.email,
                }),
            });

            toast.success('Gasto registrado y distribuido entre los miembros');
            navigate(`/casa-familiar/${id}`);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error al cargar el gasto');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <CasaFamiliarLayout title="Cargar Gasto" homeId={id}>
            <div className="space-y-6 pb-20 max-w-lg mx-auto">

                <Card>
                    <CardHeader>
                        <CardTitle>Nuevo Gasto</CardTitle>
                        <p className="text-sm text-gray-500">
                            El gasto se dividirá automáticamente entre todos los miembros según sus metros cuadrados.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="space-y-2">
                                <Label htmlFor="descripcion">Descripción *</Label>
                                <Input
                                    id="descripcion"
                                    placeholder="Ej: Factura de luz de enero"
                                    value={form.descripcion}
                                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="monto">Monto *</Label>
                                <Input
                                    id="monto"
                                    type="number"
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                    value={form.monto}
                                    onChange={e => setForm({ ...form, monto: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Categoría *</Label>
                                <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                                    <SelectTrigger><SelectValue placeholder="Seleccioná una categoría" /></SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIAS.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fecha">Fecha</Label>
                                <Input
                                    id="fecha"
                                    type="date"
                                    value={form.fecha}
                                    onChange={e => setForm({ ...form, fecha: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => navigate(`/casa-familiar/${id}`)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    disabled={enviando}
                                >
                                    {enviando
                                        ? <><Loader2 className="size-4 animate-spin mr-2" />Guardando...</>
                                        : 'Confirmar Gasto'
                                    }
                                </Button>
                            </div>

                        </form>
                    </CardContent>
                </Card>

            </div>
        </CasaFamiliarLayout>
    );
}