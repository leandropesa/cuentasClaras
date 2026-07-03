import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { ArrowLeft, Copy, Check, Home, Save, Loader2, Settings, Shield, ShieldOff, UserX, Lock, History, Repeat } from 'lucide-react';
import { LogoMark } from '../components/LogoMark';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
  updateConsortiumName,
  updateBankDetails,
  getConsortiumById,
  updateMemberMetrosCuadrados,
  promoteToAdmin,
  demoteFromAdmin,
  removeMember,
  ConsortiumDto,
  ConsortiumMemberDto,
} from '../../services/consortiumService';
import { apiFetch } from '../../services/apiClient';
import { updateDiaCierre } from '../../services/consortiumService';

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface MemberInfo {
  userId: number;
  nombre: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  balance: number;
  metrosCuadrados: number;
}

type ConfigAction =
  | { type: 'promote'; memberId: number; nombre: string }
  | { type: 'demote'; memberId: number; nombre: string }
  | { type: 'remove'; memberId: number; nombre: string };

// ── Helpers de API ────────────────────────────────────────────────────────────

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// ── Componente ────────────────────────────────────────────────────────────────

export function ConfigurarGrupo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, grupoActivo, cargarGrupos } = useAuth();

  const isSetup = !!location.state?.tipo;
  const tipo = isSetup
    ? (location.state!.tipo as 'PROPIEDAD_HORIZONTAL' | 'CASA_FAMILIAR')
    : undefined;
  const consortiumId = isSetup
    ? (location.state!.consortiumId as number | undefined)
    : (grupoActivo ? Number(grupoActivo.id) : undefined);
  const homeId = isSetup ? (location.state?.homeId as number | undefined) : undefined;
  const initialName = isSetup
    ? (location.state!.nombreInicial as string ?? 'Sin nombre')
    : (grupoActivo?.nombre ?? '');
  const initialCode = isSetup
    ? (location.state!.invitationCode as string ?? null)
    : (grupoActivo?.codigoInvitacion ?? null);

  // Casa familiar setup mode: new family home (already created, shows code + name)
  const isCasaFamiliarWizard = isSetup && tipo === 'CASA_FAMILIAR' && !!homeId;

  // ── States ────────────────────────────────────────────────────────
  const [nombreGrupo, setNombreGrupo] = useState(initialName === 'Sin nombre' ? '' : initialName);
  const [codigo, setCodigo] = useState<string | null>(initialCode);
  const [copiado, setCopiado] = useState(false);
  const [saving, setSaving] = useState(false);

  // Bank details
  const [cbu, setCbu] = useState('');
  const [alias, setAlias] = useState('');
  const [titular, setTitular] = useState('');
  const [bankSaving, setBankSaving] = useState(false);

  // Member config
  const [configMember, setConfigMember] = useState<MemberInfo | null>(null);
  const [pendingAction, setPendingAction] = useState<ConfigAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingM2, setEditingM2] = useState<string | null>(null);
  const [m2Loading, setM2Loading] = useState(false);
  const [consortiumMembers, setConsortiumMembers] = useState<ConsortiumMemberDto[]>([]);

  const [finalizando, setFinalizando] = useState(false);

  // Cierre automático
  const [diaCierre, setDiaCierre]       = useState<number | null>(null);
  const [savingCierre, setSavingCierre] = useState(false);

  const handleSaveDiaCierre = async (dia: number | null) => {
    if (!consortiumId) return;
    setSavingCierre(true);
    try {
      await updateDiaCierre(consortiumId, dia);
      setDiaCierre(dia);
      toast.success(dia ? `Cierre automático configurado para el día ${dia}` : 'Cierre automático desactivado');
    } catch { toast.error('Error al guardar el día de cierre'); }
    finally { setSavingCierre(false); }
  };

  // ── Effects ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (isSetup && tipo === 'CASA_FAMILIAR' && !homeId) { navigate('/crear-grupo'); return; }
    if (!isCasaFamiliarWizard && !consortiumId) {
      navigate(isSetup ? '/crear-grupo' : '/mis-grupos');
      return;
    }
  }, [consortiumId, homeId, navigate, user, isSetup, isCasaFamiliarWizard, tipo]);

  useEffect(() => {
    if (!consortiumId) return;
    const needsData = !codigo || (!isSetup && !cbu && !alias && !titular) || isSetup;
    if (!needsData) return;
    getConsortiumById(consortiumId).then((c: ConsortiumDto) => {
      if (!codigo) setCodigo(c.invitationCode);
      if (c.cbu) setCbu(c.cbu);
      if (c.alias) setAlias(c.alias);
      if (c.titular) setTitular(c.titular);
      if (c.diaCierre) setDiaCierre(c.diaCierre);
      if (isSetup) {
        if (c.name !== 'Sin nombre') setNombreGrupo(c.name);
        setConsortiumMembers(c.members);
      }
    }).catch(() => {});
  }, [consortiumId]);

  if (!user) return null;
  if (!isCasaFamiliarWizard && !consortiumId) return null;

  // ── Casa familiar setup handler ───────────────────────────────────

  const handleFinalizarCasaFamiliar = async () => {
    if (!homeId) return;
    const name = nombreGrupo.trim();
    setFinalizando(true);
    try {
      if (name && name !== 'Sin nombre') {
        await apiFetch(`/api/family-homes/${homeId}/name`, {
          method: 'PUT',
          headers: JSON_HEADERS,
          body: JSON.stringify({ name }),
        });
      }
      await cargarGrupos();
      navigate(`/casa-familiar/${homeId}`);
    } catch {
      toast.error('Error al guardar el nombre');
      setFinalizando(false);
    }
  };

  // ── Consortium handlers ───────────────────────────────────────────

  const handleSaveName = async () => {
    if (!consortiumId) return;
    const name = nombreGrupo.trim();
    if (!name) { toast.error('El nombre no puede estar vacío'); return; }
    setSaving(true);
    try {
      await updateConsortiumName(consortiumId, name);
      await cargarGrupos();
      toast.success('Nombre del grupo actualizado');
    } catch {
      toast.error('Error al actualizar el nombre');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBank = async () => {
    if (!consortiumId) return;
    setBankSaving(true);
    try {
      await updateBankDetails(consortiumId, { cbu: cbu.trim(), alias: alias.trim(), titular: titular.trim() });
      await cargarGrupos();
      toast.success('Datos bancarios actualizados');
    } catch {
      toast.error('Error al actualizar los datos bancarios');
    } finally {
      setBankSaving(false);
    }
  };

  const handleFinalizar = async () => {
    if (!consortiumId) return;
    const name = nombreGrupo.trim() || 'Sin nombre';
    if (name !== 'Sin nombre') {
      try { await updateConsortiumName(consortiumId, name); }
      catch { toast.error('Error al actualizar el nombre'); return; }
    }
    try {
      await updateBankDetails(consortiumId, { cbu: cbu.trim(), alias: alias.trim(), titular: titular.trim() });
    } catch {
      toast.error('Error al guardar los datos bancarios'); return;
    }
    await cargarGrupos();
    navigate('/mis-grupos');
  };

  const refetchMembers = async () => {
    if (!isSetup || !consortiumId) return;
    try {
      const c = await getConsortiumById(consortiumId);
      setConsortiumMembers(c.members);
    } catch {}
  };

  const handleConfigAction = async () => {
    if (!pendingAction || !consortiumId) return;
    setActionLoading(true);
    try {
      const { type, memberId } = pendingAction;
      if (type === 'promote') {
        await promoteToAdmin(consortiumId, memberId);
      } else if (type === 'demote') {
        await demoteFromAdmin(consortiumId, memberId);
      } else if (type === 'remove') {
        await removeMember(consortiumId, memberId);
      }
      if (isSetup) {
        await refetchMembers();
      } else {
        await cargarGrupos();
      }
      setConfigMember(null);
      setPendingAction(null);
      toast.success(
        type === 'promote' ? 'Miembro promovido a administrador' :
        type === 'demote' ? 'Rol de administrador quitado' :
        'Miembro expulsado del grupo'
      );
    } catch (err: any) {
      const msg = err?.message || 'Error al realizar la acción';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveM2 = async () => {
    if (editingM2 === null || editingM2 === '' || !configMember || !consortiumId) return;
    const m2Value = parseFloat(editingM2);
    if (isNaN(m2Value)) return;
    setM2Loading(true);
    try {
      await updateMemberMetrosCuadrados(consortiumId, configMember.userId, m2Value);
      if (isSetup) {
        await refetchMembers();
      } else {
        await cargarGrupos();
      }
      setEditingM2(null);
      setConfigMember(null);
      toast.success('Metros cuadrados actualizados');
    } catch {
      toast.error('Error al actualizar los metros cuadrados');
    } finally {
      setM2Loading(false);
    }
  };

  // ── Display helpers ───────────────────────────────────────────────

  const displayMembers: Array<{
    id: string; userId: number; email: string; nombre: string; rol: 'ADMIN' | 'MEMBER'; metrosCuadrados: number;
  }> = isSetup
    ? consortiumMembers.map(m => ({ id: String(m.userId), userId: m.userId, email: m.email, nombre: m.nombre, rol: m.role, metrosCuadrados: m.metrosCuadrados }))
    : (grupoActivo?.miembros ?? []).map(m => ({ id: m.id, userId: parseInt(m.id), email: m.email, nombre: m.nombre, rol: m.rol, metrosCuadrados: m.metrosCuadrados }));

  const getMemberInfo = (item: typeof displayMembers[number]): MemberInfo => ({
    userId: item.userId,
    nombre: item.nombre || item.email,
    email: item.email,
    role: item.rol,
    balance: 0,
    metrosCuadrados: item.metrosCuadrados,
  });

  const getDisplayName = (member?: MemberInfo) => member?.nombre || 'este usuario';

  const getActionLabel = (action: ConfigAction | null) => {
    if (!action) return '';
    if (action.type === 'promote') return `Promover a Admin a ${action.nombre}`;
    if (action.type === 'demote') return `Quitar rol Admin a ${action.nombre}`;
    if (action.type === 'remove') return `Expulsar a ${action.nombre}`;
    return '';
  };

  const getActionDescription = (action: ConfigAction | null) => {
    if (!action) return '';
    if (action.type === 'promote')
      return `${action.nombre} pasará a ser administrador y podrá cargar gastos fijos, expulsar miembros y cambiar roles.`;
    if (action.type === 'demote')
      return `${action.nombre} pasará a ser miembro regular. Seguirá viendo el grupo pero sin permisos de administración.`;
    if (action.type === 'remove')
      return `${action.nombre} será expulsado del grupo. Esta acción no se puede deshacer. El miembro debe tener saldo cero.`;
    return '';
  };

  const getTipoInfo = () => {
    if (tipo === 'PROPIEDAD_HORIZONTAL') return { icono: <LogoMark className="size-6" />, nombre: 'Propiedad Horizontal', color: 'bg-transparent border border-slate-600/60' };
    if (tipo === 'CASA_FAMILIAR') return { icono: <Home className="size-6 text-white" />, nombre: 'Casa Familiar / Compartida', color: 'bg-green-600' };
    return null;
  };

  const tipoInfo = getTipoInfo();

  // ── Casa Familiar Setup UI ────────────────────────────────────────

  if (isCasaFamiliarWizard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/mis-grupos')} className="gap-2">
              <ArrowLeft className="size-4" /> Mis Grupos
            </Button>
            <Badge variant="outline" className="gap-2">
              <div className="w-2 h-2 rounded-full bg-green-600" />
              Casa Familiar / Compartida
            </Badge>
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-2">
              <Home className="size-8 text-white" />
            </div>
            <h1 className="font-bold text-3xl">¡Tu casa fue creada!</h1>
            <p className="text-gray-600">Dale un nombre y compartí el código para que se unan</p>
          </div>

          <Card>
            <CardHeader><CardTitle>Nombre del Espacio</CardTitle></CardHeader>
            <CardContent>
              <Input
                id="nombre"
                placeholder="Ej: Casa de la familia García"
                value={nombreGrupo}
                onChange={e => setNombreGrupo(e.target.value)}
              />
            </CardContent>
          </Card>

          {codigo && (
            <Card className="border-2 border-green-500 bg-green-50/50">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <p className="text-sm font-medium text-green-700">Código de invitación</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-2xl font-bold tracking-widest text-green-800 bg-white px-4 py-2 rounded-lg border">
                      {codigo}
                    </code>
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText(codigo);
                      setCopiado(true);
                      setTimeout(() => setCopiado(false), 2000);
                    }}>
                      {copiado ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-green-600">Compartí este código con quienes quieras que se unan</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleFinalizarCasaFamiliar}
            disabled={finalizando}
          >
            {finalizando ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            {finalizando ? 'Guardando...' : 'Ir a la Casa Familiar →'}
          </Button>
        </div>
      </div>
    );
  }

  // ── Consortium Configuration UI ───────────────────────────────────

  const mainContent = (
    <div className="space-y-6">

      {isSetup && tipoInfo && (
        <div className="flex justify-end">
          <Badge variant="outline" className="gap-2">
            <div className={`w-2 h-2 rounded-full ${tipoInfo.color}`}></div>
            {tipoInfo.nombre}
          </Badge>
        </div>
      )}

      {/* Nombre del grupo */}
      <Card>
        <CardHeader>
          <CardTitle>Nombre del Grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              id="nombre"
              placeholder="Ej: Edificio San Martín 123"
              value={nombreGrupo}
              onChange={(e) => setNombreGrupo(e.target.value)}
              className={isSetup ? '' : 'flex-1'}
            />
            {!isSetup && (
              <Button onClick={handleSaveName} disabled={saving} className="gap-2 shrink-0">
                <Save className="size-4" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Código de invitación */}
      {codigo && (
        <Card className="border-2 border-green-500 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <p className="text-sm font-medium text-green-700">Código de invitación</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-2xl font-bold tracking-widest text-green-800 bg-white px-4 py-2 rounded-lg border">
                  {codigo}
                </code>
                <Button variant="outline" size="sm" onClick={() => {
                  navigator.clipboard.writeText(codigo);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 2000);
                }}>
                  {copiado ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <p className="text-xs text-green-600">Compartí este código con quienes quieras que se unan al grupo</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Miembros */}
      {displayMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Miembros del Grupo ({displayMembers.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {displayMembers.map((m) => {
              const info = getMemberInfo(m);
              return (
                <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                      {m.nombre?.charAt(0)?.toUpperCase() ?? m.email?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.nombre || m.email}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{m.email}</span>
                        {m.rol === 'ADMIN' && (
                          <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700">Admin</Badge>
                        )}
                        {m.id === user?.id && (
                          <Badge variant="secondary" className="text-xs">Tú</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfigMember(info)}
                    className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
                    title="Configurar miembro"
                  >
                    <Settings className="size-4 text-gray-500" />
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Resumen (solo setup) */}
      {isSetup && tipoInfo && (
        <div className="p-4 bg-blue-50 rounded-lg space-y-2">
          <p className="text-sm font-medium">Resumen del Grupo</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-600">Tipo</p><p className="font-medium">{tipoInfo.nombre}</p></div>
            <div><p className="text-gray-600">Miembros</p><p className="font-medium">{consortiumMembers.length} personas</p></div>
          </div>
        </div>
      )}

      {/* Cierre automático */}
      {consortiumId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cierre Automático de Período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={diaCierre ?? 0}
                onChange={e => handleSaveDiaCierre(Number(e.target.value) || null)}
                disabled={savingCierre}
                className="flex-1 h-9 border rounded-md px-3 text-sm bg-white"
              >
                <option value={0}>Sin cierre automático</option>
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>Día {d} de cada mes</option>
                ))}
              </select>
              {savingCierre && <Loader2 className="size-4 animate-spin text-gray-400 shrink-0" />}
            </div>
            <p className="text-xs text-gray-400">
              {diaCierre
                ? `El período se cierra automáticamente el día ${diaCierre} de cada mes.`
                : 'El período no se cierra automáticamente.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Herramientas del grupo (solo fuera del wizard) */}
      {!isSetup && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Herramientas del Grupo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => navigate('/historial-periodos')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 text-left transition-colors"
            >
              <History className="size-4 text-gray-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">Historial de Períodos</p>
                <p className="text-xs text-gray-500">Ver rendiciones anteriores</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/gastos-recurrentes')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 text-left transition-colors"
            >
              <Repeat className="size-4 text-gray-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">Gastos Recurrentes</p>
                <p className="text-xs text-gray-500">Plantillas que se aplican automáticamente</p>
              </div>
            </button>
          </CardContent>
        </Card>
      )}

      {/* Datos bancarios */}
      <Card className="bg-blue-50 border-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-900">Datos para Transferencias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cbu" className="text-blue-800">CBU</Label>
            <Input id="cbu" placeholder="0170123456789012345678" value={cbu} onChange={(e) => setCbu(e.target.value)} maxLength={22} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alias" className="text-blue-800">Alias</Label>
            <Input id="alias" placeholder="SOCIOS.GASTOS.COMUNES" value={alias} onChange={(e) => setAlias(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="titular" className="text-blue-800">Titular</Label>
            <Input id="titular" placeholder="Consorcio de Socios" value={titular} onChange={(e) => setTitular(e.target.value)} />
          </div>
          {!isSetup && (
            <Button onClick={handleSaveBank} disabled={bankSaving} className="gap-2">
              <Save className="size-4" />
              {bankSaving ? 'Guardando...' : 'Guardar datos bancarios'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Botón finalizar (solo setup) */}
      {isSetup && (
        <Button size="lg" className="w-full" onClick={handleFinalizar}>
          Ir a Mis Grupos
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Dialog confirmación acción */}
      <Dialog open={!!pendingAction} onOpenChange={(o) => !o && setPendingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getActionLabel(pendingAction)}</DialogTitle>
            <DialogDescription>{getActionDescription(pendingAction)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)}>Cancelar</Button>
            <Button
              variant={pendingAction?.type === 'remove' ? 'destructive' : 'default'}
              onClick={handleConfigAction}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog config de miembro */}
      <Dialog open={!!configMember} onOpenChange={(o) => { if (!o) setConfigMember(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar miembro</DialogTitle>
            <DialogDescription>
              {configMember?.nombre} — {configMember?.email}
            </DialogDescription>
          </DialogHeader>

          {configMember && (
            <div className="space-y-3 py-2">
              <Badge variant="outline" className={
                configMember.role === 'ADMIN'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600'
              }>
                {configMember.role === 'ADMIN' ? 'Administrador' : 'Miembro'}
              </Badge>

              <div className="space-y-2 pt-2">
                {editingM2 !== null ? (
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <label className="text-xs font-medium text-gray-600">Metros cuadrados (m²)</label>
                    <Input
                      type="number" step="1" min="0"
                      value={editingM2}
                      onChange={(e) => setEditingM2(e.target.value)}
                      className="text-sm"
                      placeholder="Ej: 80"
                    />
                    <p className="text-xs text-gray-500">Actual: {configMember.metrosCuadrados} m²</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingM2(null)} className="flex-1">Cancelar</Button>
                      <Button size="sm" onClick={handleSaveM2} disabled={m2Loading || editingM2 === '' || parseFloat(editingM2) === configMember.metrosCuadrados} className="flex-1">
                        {m2Loading ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                        Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setEditingM2(String(configMember.metrosCuadrados))}>
                    <Lock className="size-4 text-purple-600" />
                    {configMember.metrosCuadrados} m²
                  </Button>
                )}

                {configMember.role === 'MEMBER' && (
                  <Button
                    variant="outline" className="w-full justify-start gap-2"
                    onClick={() => {
                      setPendingAction({ type: 'promote', memberId: configMember.userId, nombre: getDisplayName(configMember) });
                      setConfigMember(null);
                    }}
                  >
                    <Shield className="size-4 text-blue-600" />
                    Promover a administrador
                  </Button>
                )}

                {configMember.role === 'ADMIN' && String(configMember.userId) !== user?.id && (
                  <Button
                    variant="outline" className="w-full justify-start gap-2"
                    onClick={() => {
                      setPendingAction({ type: 'demote', memberId: configMember.userId, nombre: getDisplayName(configMember) });
                      setConfigMember(null);
                    }}
                  >
                    <ShieldOff className="size-4 text-orange-500" />
                    Quitar rol de administrador
                  </Button>
                )}

                {String(configMember.userId) !== user?.id && (
                  <Button
                    variant="outline" className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setPendingAction({ type: 'remove', memberId: configMember.userId, nombre: getDisplayName(configMember) });
                      setConfigMember(null);
                    }}
                  >
                    <UserX className="size-4" />
                    Expulsar del grupo
                  </Button>
                )}

                {String(configMember.userId) === user?.id && (
                  <p className="text-xs text-gray-400 text-center pt-2">No podés modificar tu propio rol ni expulsarte.</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfigMember(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isSetup ? (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/mis-grupos')} className="gap-2">
              <ArrowLeft className="size-4" />
              Volver
            </Button>
            {mainContent}
          </div>
        </div>
      ) : (
        <Layout title="Configuración del Grupo">
          {mainContent}
        </Layout>
      )}
    </>
  );
}
