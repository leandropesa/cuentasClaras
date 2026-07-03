import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CasaFamiliarLayout } from '../components/CasaFamiliarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Loader2, PlusCircle, TrendingDown, TrendingUp, Minus, Home } from 'lucide-react';
import { apiFetch } from '@/services/apiClient.ts';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface FamilyHomeMember {
    userId: number;
    name: string;
    email: string;
    role: string;
    balance: number;
}

interface FamilyHomeExpense {
    id: number;
    familyHomeId: number;
    descripcion: string;
    monto: number;
    categoria: string;
    fecha: string;
    cargadoPor: string;
}

interface FamilyHome {
    id: number;
    name: string;
    createdAt: string;
    invitationCode: string;
    members: FamilyHomeMember[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n ?? 0);

const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });

// ── Componente ────────────────────────────────────────────────────────────────

export function CasaFamiliarDashboard() {
    const { id }       = useParams<{ id: string }>();
    const navigate     = useNavigate();
    const { user }     = useAuth();

    const [home,     setHome]     = useState<FamilyHome | null>(null);
    const [gastos,   setGastos]   = useState<FamilyHomeExpense[]>([]);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState<string | null>(null);

    // Modal pago
    const [pagoOpen,     setPagoOpen]     = useState(false);
    const [montoPago,    setMontoPago]    = useState('');
    const [enviandoPago, setEnviandoPago] = useState(false);

    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    const cargarDatos = useCallback(() => {
        if (!id) return;
        setLoading(true);
        setError(null);

        Promise.all([
            apiFetch<FamilyHome>(`/api/family-homes/${id}`),
            apiFetch<FamilyHomeExpense[]>(`/api/family-homes/${id}/expenses`),
        ])
            .then(([homeData, gastosData]) => {
                setHome(homeData);
                setGastos(gastosData);
            })
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const handlePagar = async () => {
        const monto = parseFloat(montoPago);
        if (!montoPago || isNaN(monto) || monto <= 0) {
            toast.error('Ingresá un monto válido');
            return;
        }
        if (!id) return;
        setEnviandoPago(true);
        try {
            const updated = await apiFetch<FamilyHome>(`/api/family-homes/${id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ monto }),
            });
            setHome(updated);
            setPagoOpen(false);
            setMontoPago('');
            toast.success('Pago registrado correctamente');
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error al registrar el pago');
        } finally {
            setEnviandoPago(false);
        }
    };

    if (!user) return null;

    const miembro     = home?.members.find(m => m.userId === Number(user.id));
    const miBalance   = miembro?.balance ?? 0;
    const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
    const isAdmin     = miembro?.role === 'ADMIN';

    return (
        <CasaFamiliarLayout title={home?.name ?? 'Casa Familiar'} homeId={id} isAdmin={isAdmin}>
            <div className="space-y-6 pb-20">

            {/* ── Modal de pago ── */}
            <Dialog open={pagoOpen} onOpenChange={(open) => { if (!open) { setPagoOpen(false); setMontoPago(''); } }}>
                <DialogContent className="max-w-sm mx-4 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Notificar pago</DialogTitle>
                        <DialogDescription>
                            Ingresá el monto que pagaste. El saldo se acredita de inmediato.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-1">
                        <div className="space-y-1.5">
                            <Label htmlFor="monto-cf" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Monto (ARS)
                            </Label>
                            <input
                                id="monto-cf"
                                type="number"
                                min="0"
                                step="0.01"
                                value={montoPago}
                                onChange={(e) => setMontoPago(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-2xl font-bold text-slate-900 bg-slate-50 text-center focus:outline-none focus:ring-2 focus:ring-slate-300"
                                placeholder="0"
                                autoFocus
                            />
                            {miBalance < 0 && (
                                <p className="text-xs text-gray-400 text-center">
                                    Deuda actual: {formatCurrency(Math.abs(miBalance))}{' '}
                                    <button
                                        type="button"
                                        className="text-blue-500 underline"
                                        onClick={() => setMontoPago(Math.abs(miBalance).toFixed(2))}
                                    >
                                        usar este monto
                                    </button>
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => { setPagoOpen(false); setMontoPago(''); }} disabled={enviandoPago}>
                                Cancelar
                            </Button>
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={handlePagar}
                                disabled={enviandoPago}
                            >
                                {enviandoPago ? <><Loader2 className="size-4 animate-spin mr-2" />Registrando...</> : 'Confirmar'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

                {/* Header verde */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <Home className="size-5 text-green-600" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg">{home?.name}</h2>
                        <p className="text-sm text-gray-500">{home?.members.length ?? 0} miembros</p>
                    </div>
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

                {!loading && home && (
                    <>
                        {/* Mi situación */}
                        <Card className={miBalance < 0 ? 'border-red-200' : miBalance > 0 ? 'border-green-200' : ''}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Mi Situación</CardTitle>
                                    <Badge className={
                                        miBalance > 0 ? 'bg-green-600' :
                                            miBalance < 0 ? 'bg-red-600' :
                                                'bg-gray-400'
                                    }>
                                        {miBalance > 0 ? 'A FAVOR' : miBalance < 0 ? 'DEBE' : 'AL DÍA'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    {miBalance > 0
                                        ? <TrendingUp className="size-8 text-green-500" />
                                        : miBalance < 0
                                            ? <TrendingDown className="size-8 text-red-500" />
                                            : <Minus className="size-8 text-gray-400" />
                                    }
                                    <div>
                                        <p className="text-3xl font-bold">
                                            {formatCurrency(Math.abs(miBalance))}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {miBalance > 0 ? 'A tu favor' : miBalance < 0 ? 'Debés' : 'Estás al día'}
                                        </p>
                                    </div>
                                </div>
                                {miBalance < 0 && (
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700 font-semibold"
                                        onClick={() => { setMontoPago(Math.abs(miBalance).toFixed(2)); setPagoOpen(true); }}
                                    >
                                        Notificar pago
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Resumen */}
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardContent className="pt-4">
                                    <p className="text-sm text-gray-500">Total gastos</p>
                                    <p className="text-xl font-bold">{formatCurrency(totalGastos)}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-4">
                                    <p className="text-sm text-gray-500">Miembros</p>
                                    <p className="text-xl font-bold">{home.members.length}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Balances del grupo */}
                        <Card>
                            <CardHeader><CardTitle>Estado por Miembro</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                {home.members.map(m => {
                                    const estado = m.balance > 0 ? 'A FAVOR' : m.balance < 0 ? 'DEBE' : 'AL DÍA';
                                    return (
                                        <div
                                            key={m.userId}
                                            className={`flex items-center justify-between p-3 rounded-lg border ${
                                                m.userId === Number(user.id) ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                                            }`}
                                        >
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {m.name}
                                                    {m.userId === Number(user.id) && (
                                                        <span className="ml-2 text-xs text-blue-500">(vos)</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {m.role === 'ADMIN' ? 'Administrador' : 'Miembro'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-semibold text-sm ${
                                                    m.balance > 0 ? 'text-green-600' :
                                                        m.balance < 0 ? 'text-red-600' :
                                                            'text-gray-500'
                                                }`}>
                                                    {m.balance === 0 ? '—' : formatCurrency(Math.abs(m.balance))}
                                                </p>
                                                <Badge className={`text-xs ${
                                                    estado === 'A FAVOR' ? 'bg-green-600' :
                                                        estado === 'DEBE'    ? 'bg-red-600' :
                                                            'bg-gray-400'
                                                }`}>
                                                    {estado}
                                                </Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        {/* Últimos gastos */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Gastos</CardTitle>
                                    <Button
                                        size="sm"
                                        className="gap-1 bg-green-600 hover:bg-green-700"
                                        onClick={() => navigate(`/casa-familiar/${id}/cargar-gasto`)}
                                    >
                                        <PlusCircle className="size-4" /> Agregar
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {gastos.length === 0 ? (
                                    <div className="text-center py-8 space-y-2">
                                        <p className="text-gray-500 text-sm">Todavía no hay gastos</p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                            onClick={() => navigate(`/casa-familiar/${id}/cargar-gasto`)}
                                        >
                                            <PlusCircle className="size-4" /> Cargar el primer gasto
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {gastos.map(g => (
                                            <div key={g.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{g.descripcion}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {g.categoria} · {formatDate(g.fecha)} · por {g.cargadoPor}
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

                    </>
                )}
            </div>
        </CasaFamiliarLayout>
    );
}