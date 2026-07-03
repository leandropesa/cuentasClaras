import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CasaFamiliarLayout } from '../components/CasaFamiliarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Loader2, UserX, Copy, Check, Shield, Save } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../services/apiClient';
import { useAuth } from '../context/AuthContext';

interface FamilyHomeMember {
    userId: number;
    name: string;
    email: string;
    role: string;
    balance: number;
}

interface FamilyHome {
    id: number;
    name: string;
    invitationCode: string;
    members: FamilyHomeMember[];
}

export function CasaFamiliarConfig() {
    const { id }   = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [home, setHome]               = useState<FamilyHome | null>(null);
    const [loading, setLoading]         = useState(false);
    const [copiado, setCopiado]         = useState(false);
    const [nombre, setNombre]           = useState('');
    const [guardandoNombre, setGuardandoNombre] = useState(false);

    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    const cargarHome = useCallback(() => {
        if (!id) return;
        setLoading(true);
        apiFetch<FamilyHome>(`/api/family-homes/${id}`)
            .then(h => { setHome(h); setNombre(h.name); })
            .catch(() => toast.error('Error al cargar los datos'))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => { cargarHome(); }, [cargarHome]);

    if (!user) return null;

    const isAdmin = home?.members.find(m => m.userId === Number(user.id))?.role === 'ADMIN';

    const handleCopiarCodigo = () => {
        if (!home) return;
        navigator.clipboard.writeText(home.invitationCode);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    const handleGuardarNombre = async () => {
        const name = nombre.trim();
        if (!name) { toast.error('El nombre no puede estar vacío'); return; }
        setGuardandoNombre(true);
        try {
            await apiFetch(`/api/family-homes/${id}/name`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            toast.success('Nombre actualizado');
            cargarHome();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error al actualizar el nombre');
        } finally {
            setGuardandoNombre(false);
        }
    };

    const handleRemover = async (memberId: number, nombre: string) => {
        if (!confirm(`¿Querés remover a ${nombre} del grupo?`)) return;
        try {
            await apiFetch(`/api/family-homes/${id}/members/${memberId}`, { method: 'DELETE' });
            toast.success(`${nombre} fue removido del grupo`);
            cargarHome();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error al remover miembro');
        }
    };

    const handlePromover = async (memberId: number, nombre: string, esAdmin: boolean) => {
        const nuevoRol = esAdmin ? 'MEMBER' : 'ADMIN';
        const accion   = esAdmin ? 'quitar admin a' : 'hacer admin a';
        if (!confirm(`¿Querés ${accion} ${nombre}?`)) return;
        try {
            await apiFetch(`/api/family-homes/${id}/members/${memberId}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: nuevoRol }),
            });
            toast.success(esAdmin ? `${nombre} ya no es admin` : `${nombre} ahora es admin`);
            cargarHome();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Error al cambiar el rol');
        }
    };

    return (
        <CasaFamiliarLayout title="Miembros" homeId={id} isAdmin={isAdmin}>
            <div className="space-y-6 pb-20 max-w-lg mx-auto">

                {loading && (
                    <div className="flex justify-center py-10">
                        <Loader2 className="size-8 animate-spin text-gray-400" />
                    </div>
                )}

                {!loading && home && (
                    <>
                        {/* Nombre — solo admin */}
                        {isAdmin && (
                            <Card>
                                <CardHeader><CardTitle>Nombre del grupo</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="flex gap-2">
                                        <Input
                                            value={nombre}
                                            onChange={e => setNombre(e.target.value)}
                                            placeholder="Nombre del grupo"
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={handleGuardarNombre}
                                            disabled={guardandoNombre || nombre.trim() === home.name}
                                            className="gap-2 shrink-0"
                                        >
                                            {guardandoNombre
                                                ? <Loader2 className="size-4 animate-spin" />
                                                : <Save className="size-4" />
                                            }
                                            Guardar
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Código de invitación — visible para todos */}
                        <Card className="border-2 border-green-500 bg-green-50/50">
                            <CardContent className="pt-6">
                                <div className="text-center space-y-3">
                                    <p className="text-sm font-medium text-green-700">Código de invitación</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <code className="text-2xl font-bold tracking-widest text-green-800 bg-white px-4 py-2 rounded-lg border">
                                            {home.invitationCode}
                                        </code>
                                        <Button variant="outline" size="sm" onClick={handleCopiarCodigo}>
                                            {copiado ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-green-600">
                                        Compartí este código con quienes quieras que se unan
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lista de miembros */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Miembros ({home.members.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {home.members.map(m => {
                                    const esMiembroAdmin = m.role === 'ADMIN';
                                    const esSelf = m.userId === Number(user.id);
                                    return (
                                        <div key={m.userId} className={`flex items-center justify-between p-3 rounded-lg border ${
                                            esSelf ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                                        }`}>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm">
                                                    {m.name}
                                                    {esSelf && <span className="ml-2 text-xs text-blue-500">(vos)</span>}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">{m.email}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                                <Badge variant="outline" className={`text-xs ${esMiembroAdmin ? 'border-blue-200 bg-blue-50 text-blue-700' : ''}`}>
                                                    {esMiembroAdmin ? 'Admin' : 'Miembro'}
                                                </Badge>
                                                {/* Acciones solo para admin, sobre otros miembros */}
                                                {isAdmin && !esSelf && (
                                                    <>
                                                        <button
                                                            onClick={() => handlePromover(m.userId, m.name, esMiembroAdmin)}
                                                            className="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors"
                                                            title={esMiembroAdmin ? 'Quitar admin' : 'Hacer admin'}
                                                        >
                                                            <Shield className="size-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemover(m.userId, m.name)}
                                                            className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                                                            title="Remover del grupo"
                                                        >
                                                            <UserX className="size-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </CasaFamiliarLayout>
    );
}
