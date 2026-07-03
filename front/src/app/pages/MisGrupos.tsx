import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import { Home, Users, Plus, ChevronRight, LogOut, UserPlus, Building2, Trash2, Loader2 } from 'lucide-react';
import { LogoMark } from '../components/LogoMark';
import { useAuth } from '../context/AuthContext';
import { deleteConsortium } from '../../services/consortiumService';
import { toast } from 'sonner';
import { apiFetch } from '@/services/apiClient.ts';

interface FamilyHome {
  id: number;
  name: string;
  createdAt: string;
  members: { userId: number; name: string; email: string; role: string; balance: number; metrosCuadrados: number }[];
}

export function MisGrupos() {
  const navigate = useNavigate();
  const { user, grupos, logout, seleccionarGrupo, cargarGrupos } = useAuth();
  const [deleteando, setDeleteando] = useState<string | null>(null);
  const [casasFamiliares, setCasasFamiliares] = useState<FamilyHome[]>([]);
  const [loadingCasas, setLoadingCasas] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    setLoadingCasas(true);
    apiFetch<FamilyHome[]>('/api/family-homes/mine')
        .then(data => setCasasFamiliares(Array.isArray(data) ? data : []))
        .catch(() => setCasasFamiliares([]))
        .finally(() => setLoadingCasas(false));
  }, [user]);

  if (!user) return null;

  const handleSeleccionarGrupo = (grupoId: string) => {
    seleccionarGrupo(grupoId);
    navigate('/inicio');
  };

  const handleDelete = async (grupoId: string) => {
    try {
      await deleteConsortium(parseInt(grupoId));
      await cargarGrupos();
      toast.success('Grupo eliminado');
    } catch {
      toast.error('Error al eliminar el grupo');
    } finally {
      setDeleteando(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getTipoInfo = (tipo: 'PROPIEDAD_HORIZONTAL' | 'CASA_FAMILIAR') => {
    if (tipo === 'PROPIEDAD_HORIZONTAL') {
      return {
        icono: <LogoMark className="size-9" />,
        nombre: 'Propiedad Horizontal',
        color: 'bg-transparent border border-slate-600/60',
        colorBadge: 'bg-blue-100 text-blue-700',
      };
    }
    return {
      icono: <Home className="size-6 text-white" />,
      nombre: 'Casa Familiar',
      color: 'bg-green-600',
      colorBadge: 'bg-green-100 text-green-700',
    };
  };

  const hayGrupos = grupos.length > 0 || casasFamiliares.length > 0;

  return (
      <div className="min-h-screen bg-gray-50">

        <header className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => navigate('/mis-grupos')}>
                CuentasClaras
              </h1>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="size-4" /> Salir
            </Button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-6">

            <div className="text-center space-y-2">
              <h2 className="font-bold text-2xl">Mis Grupos</h2>
              <p className="text-gray-600">Seleccioná un grupo para gestionar sus gastos</p>
            </div>

            {!hayGrupos && !loadingCasas ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <Users className="size-10 text-gray-400" />
                  </div>
                  <p className="font-medium">No tenés grupos todavía</p>
                  <p className="text-sm text-gray-500">Creá un nuevo grupo o unite a uno existente</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Button onClick={() => navigate('/crear-grupo')} className="gap-2">
                      <Plus className="size-4" /> Crear Nuevo Grupo
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => navigate('/unirse-grupo')}>
                      <UserPlus className="size-4" /> Unirse a un Grupo
                    </Button>
                  </div>
                </div>
            ) : (
                <>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => navigate('/crear-grupo')} className="gap-2">
                      <Plus className="size-4" /> Crear Nuevo Grupo
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => navigate('/unirse-grupo')}>
                      <UserPlus className="size-4" /> Unirse a un Grupo
                    </Button>
                  </div>

                  {/* Propiedades Horizontales */}
                  {grupos.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                          <Building2 className="size-4 text-gray-400" />
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            Propiedad Horizontal
                          </p>
                        </div>
                        {grupos.map(grupo => {
                          const tipoInfo = getTipoInfo(grupo.tipo);
                          const totalMiembros = grupo.miembros?.length ?? 0;
                          const esAdmin = grupo.miRol === 'ADMIN';
                          return (
                              <div key={grupo.id} className="relative group">
                                <Card
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => handleSeleccionarGrupo(grupo.id)}
                                >
                                  <CardHeader>
                                    <div className="flex items-center gap-4">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tipoInfo.color}`}>
                                        {tipoInfo.icono}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h3 className="font-semibold">{grupo.nombre}</h3>
                                          <Badge className={`text-xs ${tipoInfo.colorBadge}`}>
                                            {tipoInfo.nombre}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-gray-500">{totalMiembros} miembros</p>
                                      </div>
                                      <ChevronRight className="size-5 text-gray-400" />
                                    </div>
                                  </CardHeader>
                                </Card>
                                {esAdmin && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeleteando(grupo.id); }}
                                        className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Eliminar grupo"
                                    >
                                      <Trash2 className="size-4" />
                                    </button>
                                )}
                              </div>
                          );
                        })}
                      </div>
                  )}

                  {/* Casas Familiares */}
                  {(loadingCasas || casasFamiliares.length > 0) && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                          <Home className="size-4 text-gray-400" />
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            Casas Familiares
                          </p>
                        </div>

                        {loadingCasas && (
                            <div className="flex justify-center py-4">
                              <Loader2 className="size-5 animate-spin text-gray-400" />
                            </div>
                        )}

                        {casasFamiliares.map(casa => {
                          const miMiembro = casa.members.find(m => m.userId === Number(user.id));
                          return (
                              <Card
                                  key={casa.id}
                                  className="cursor-pointer hover:shadow-md transition-shadow border-green-100"
                                  onClick={() => navigate(`/casa-familiar/${casa.id}`)}
                              >
                                <CardHeader>
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                                      <Home className="size-6 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold">{casa.name}</h3>
                                        <Badge className="text-xs bg-green-100 text-green-700">
                                          Casa Familiar
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-500">
                                        {casa.members.length} miembros ·{' '}
                                        {miMiembro?.role === 'ADMIN' ? 'Administrador' : 'Miembro'}
                                      </p>
                                    </div>
                                    <ChevronRight className="size-5 text-gray-400" />
                                  </div>
                                </CardHeader>
                              </Card>
                          );
                        })}
                      </div>
                  )}

                  <Dialog open={!!deleteando} onOpenChange={(o) => !o && setDeleteando(null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Eliminar grupo</DialogTitle>
                        <DialogDescription>
                          ¿Estás seguro de que querés eliminar este grupo? Se borrarán todos los gastos, movimientos y miembros asociados. Esta acción no se puede deshacer.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteando(null)}>Cancelar</Button>
                        <Button
                            variant="destructive"
                            disabled={deleteando === '__loading__'}
                            onClick={() => {
                              const id = deleteando;
                              if (id) { setDeleteando('__loading__'); handleDelete(id); }
                            }}
                        >
                          {deleteando === '__loading__' ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                          Eliminar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
            )}
          </div>
        </main>
      </div>
  );
}
