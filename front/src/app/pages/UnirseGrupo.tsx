import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Search, Home, Users, CheckCircle2, Ruler } from 'lucide-react';
import { LogoMark } from '../components/LogoMark';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { getConsortiumByCode, joinByCode } from '../../services/consortiumService';
import { getFamilyHomeByCode, joinFamilyHomeByCode } from '../../services/familyHomeService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';

export function UnirseGrupo() {
  const navigate = useNavigate();
  const { user, cargarGrupos } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [grupoEncontrado, setGrupoEncontrado] = useState<{
    id: number;
    name: string;
    invitationCode: string;
    tipo: 'PROPIEDAD_HORIZONTAL' | 'CASA_FAMILIAR';
    miembros: number;
  } | null>(null);
  const [showMetrosDialog, setShowMetrosDialog] = useState(false);
  const [metrosInput, setMetrosInput] = useState('1500');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const handleBuscar = async () => {
    if (!codigo.trim()) {
      toast.error('Por favor ingresá un código de invitación');
      return;
    }

    const code = codigo.trim().toUpperCase();
    setBuscando(true);
    setGrupoEncontrado(null);

    // Busca primero en consorcios, luego en casas familiares
    try {
      const consortium = await getConsortiumByCode(code);
      setGrupoEncontrado({
        id: consortium.id,
        name: consortium.name,
        invitationCode: consortium.invitationCode,
        tipo: 'PROPIEDAD_HORIZONTAL',
        miembros: consortium.members.length,
      });
      toast.success('¡Grupo encontrado!');
      setBuscando(false);
      return;
    } catch {
      // no es un consorcio, sigue buscando
    }

    try {
      const home = await getFamilyHomeByCode(code);
      setGrupoEncontrado({
        id: home.id,
        name: home.name,
        invitationCode: home.invitationCode,
        tipo: 'CASA_FAMILIAR',
        miembros: home.members.length,
      });
      toast.success('¡Grupo encontrado!');
    } catch {
      toast.error('No se encontró ningún grupo con ese código');
      setGrupoEncontrado(null);
    } finally {
      setBuscando(false);
    }
  };

  const handleUnirse = async () => {
    if (!grupoEncontrado) return;

    if (grupoEncontrado.tipo === 'CASA_FAMILIAR') {
      try {
        await joinFamilyHomeByCode(grupoEncontrado.invitationCode);
        await cargarGrupos();
        toast.success('¡Te uniste exitosamente!', {
          description: `Ahora sos parte de ${grupoEncontrado.name}`,
        });
        navigate('/mis-grupos');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'No se pudo unir al grupo';
        toast.error(msg);
      }
    } else {
      setMetrosInput('1500');
      setShowMetrosDialog(true);
    }
  };

  const handleConfirmMetros = async () => {
    if (!grupoEncontrado) return;

    const val = parseFloat(metrosInput);
    if (isNaN(val) || val <= 0) {
      toast.error('Ingresá un valor válido de metros cuadrados');
      return;
    }

    setShowMetrosDialog(false);
    try {
      await joinByCode(grupoEncontrado.invitationCode, val);
      await cargarGrupos();
      toast.success('¡Te uniste exitosamente!', {
        description: `Ahora sos parte de ${grupoEncontrado.name}`,
      });
      navigate('/mis-grupos');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo unir al grupo';
      toast.error(msg);
    }
  };

  const handleSkipMetros = async () => {
    if (!grupoEncontrado) return;

    setShowMetrosDialog(false);
    try {
      await joinByCode(grupoEncontrado.invitationCode);
      await cargarGrupos();
      toast.success('¡Te uniste exitosamente!', {
        description: `Ahora sos parte de ${grupoEncontrado.name}`,
      });
      navigate('/mis-grupos');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo unir al grupo';
      toast.error(msg);
    }
  };

  const getTipoInfo = (tipo: 'PROPIEDAD_HORIZONTAL' | 'CASA_FAMILIAR') => {
    if (tipo === 'PROPIEDAD_HORIZONTAL') {
      return {
        icono: <LogoMark className="size-8" />,
        nombre: 'Propiedad Horizontal',
        color: 'bg-transparent border border-slate-600/60',
        colorBadge: 'bg-blue-100 text-blue-700',
      };
    }
    return {
      icono: <Home className="size-8" />,
      nombre: 'Casa Familiar',
      color: 'bg-green-600',
      colorBadge: 'bg-green-100 text-green-700',
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/mis-grupos')}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Volver
          </Button>
        </div>

        <div className="text-center space-y-2">
          <h1 className="font-bold text-3xl">Unirse a un Grupo</h1>
          <p className="text-gray-600">
            Ingresá el código de invitación que recibiste
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Código de Invitación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <div className="flex gap-2">
                <Input
                  id="codigo"
                  placeholder="Ej: ABC123"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                  className="uppercase"
                />
                <Button
                  onClick={handleBuscar}
                  disabled={buscando || !codigo.trim()}
                  className="gap-2"
                >
                  <Search className="size-4" />
                  {buscando ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                El código debe ser proporcionado por un administrador del grupo
              </p>
            </div>
          </CardContent>
        </Card>

        {grupoEncontrado && (
          <Card className="border-2 border-green-500 bg-green-50/50">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="size-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Grupo encontrado</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4 mb-4">
                {(() => {
                  const tipoInfo = getTipoInfo(grupoEncontrado.tipo);
                  return (
                    <>
                      <div className={`w-16 h-16 ${tipoInfo.color} rounded-xl flex items-center justify-center`}>
                        {tipoInfo.icono}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{grupoEncontrado.name}</h3>
                        <Badge variant="outline" className={tipoInfo.colorBadge}>
                          {tipoInfo.nombre}
                        </Badge>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-2">
                          <Users className="size-4" />
                          {grupoEncontrado.miembros} miembros
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="pt-4 border-t">
                <Button onClick={handleUnirse} className="w-full" size="lg">
                  Unirse a este Grupo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5"></div>
                <p className="text-gray-700">
                  El código es proporcionado por el administrador del grupo al crearlo
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5"></div>
                <p className="text-gray-700">
                  Al unirte a un grupo, podrás ver y gestionar los gastos compartidos
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5"></div>
                <p className="text-gray-700">
                  Si no tenés un código, solicitálo al administrador del grupo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showMetrosDialog} onOpenChange={setShowMetrosDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ruler className="size-5" />
                Metros cuadrados de tu unidad
              </DialogTitle>
              <DialogDescription>
                ¿Cuántos metros cuadrados tiene tu unidad? Esto se usa para distribuir los gastos fijos proporcionalmente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="metros">Metros cuadrados (m²)</Label>
                <Input
                  id="metros"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Ej: 1500"
                  value={metrosInput}
                  onChange={(e) => setMetrosInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmMetros()}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSkipMetros} className="flex-1">
                  Omitir
                </Button>
                <Button onClick={handleConfirmMetros} className="flex-1">
                  Confirmar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
