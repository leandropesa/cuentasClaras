import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import {
  loginRequest,
  refreshSession,
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from '../../services/apiClient';
import {
  getMyConsortiums,
  ConsortiumDto,
} from '../../services/consortiumService';
import { processMyInvitations } from '../../services/invitationService';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'MEMBER';
}

export interface Miembro {
  id: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'MEMBER';
  balance: number;
  metrosCuadrados: number;
}

export interface Grupo {
  id: string;
  nombre: string;
  tipo: 'PROPIEDAD_HORIZONTAL' | 'CASA_FAMILIAR';
  miembros: Miembro[];
  miRol: 'ADMIN' | 'MEMBER';
  codigoInvitacion: string;
  cbu?: string;
  alias?: string;
  titular?: string;
}

interface AuthContextType {
  user: User | null;
  grupos: Grupo[];
  grupoActivo: Grupo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  cargarGrupos: () => Promise<void>;
  seleccionarGrupo: (grupoId: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function consortiumToGrupo(consortium: ConsortiumDto, currentUserId: string): Grupo {
  const miembros: Miembro[] = consortium.members.map((m) => ({
    id: String(m.userId),
    nombre: m.nombre,
    email: m.email,
    rol: m.role,
    balance: m.balance,
    metrosCuadrados: m.metrosCuadrados,
  }));

  const miMembership = consortium.members.find(
      (m) => String(m.userId) === currentUserId
  );
  const miRol: 'ADMIN' | 'MEMBER' = miMembership?.role ?? 'MEMBER';

  return {
    id: String(consortium.id),
    nombre: consortium.name,
    tipo: 'PROPIEDAD_HORIZONTAL',
    miembros,
    miRol,
    codigoInvitacion: consortium.invitationCode,
    cbu: consortium.cbu ?? undefined,
    alias: consortium.alias ?? undefined,
    titular: consortium.titular ?? undefined,
  };
}

function buildUserFromToken(token: string): User | null {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;

    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded  = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = JSON.parse(atob(padded)) as {
      sub?: string;
      uid?: number;
      exp?: number;
    };

    if (!decoded?.sub) return null;
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;

    return {
      id:     decoded.uid ? String(decoded.uid) : '0',
      nombre: decoded.sub.split('@')[0],
      email:  decoded.sub,
      rol:    'MEMBER',
    };
  } catch {
    return null;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<User | null>(null);
  const [grupos, setGrupos]           = useState<Grupo[]>([]);
  const [grupoActivo, setGrupoActivo] = useState<Grupo | null>(null);
  const [loading, setLoading]         = useState(true);
  const refreshInFlight = useRef(false);
  const SELECTED_GROUP_KEY = 'cc_selected_group_id';

  /** Recarga los grupos del usuario desde /api/consortiums/mine */
  const cargarGrupos = async () => {
    try {
      const currentUser = user ?? buildUserFromToken(getAccessToken() ?? '');
      if (!currentUser) return;
      const mis = await getMyConsortiums();
      setGrupos(mis.map((c) => consortiumToGrupo(c, currentUser.id)));
    } catch (err) {
      console.error('[AuthContext] Error cargando grupos:', err);
    }
  };

  // Rehidratar sesión al recargar la página
  useEffect(() => {
    const accessToken   = getAccessToken();
    const initialUser   = accessToken ? buildUserFromToken(accessToken) : null;

    if (initialUser) {
      setUser(initialUser);
      getMyConsortiums()
          .then((mis) =>
              setGrupos(mis.map((c) => consortiumToGrupo(c, initialUser.id)))
          )
          .catch(console.error)
          .finally(() => setLoading(false));
      return;
    }

    if (!getRefreshToken()) {
      setLoading(false);
      return;
    }

    if (refreshInFlight.current) {
      setLoading(false);
      return;
    }

    refreshInFlight.current = true;

    refreshSession()
        .then((auth) => {
          setTokens(auth);
          const refreshedUser = buildUserFromToken(auth.token);
          if (refreshedUser) {
            setUser(refreshedUser);
            return processMyInvitations()
                .catch(() => null)
                .then(() => getMyConsortiums())
                .then((mis) =>
                    setGrupos(mis.map((c) => consortiumToGrupo(c, refreshedUser.id)))
                );
          }
        })
        .catch(() => {
          clearTokens();
          setUser(null);
        })
        .finally(() => {
          refreshInFlight.current = false;
          setLoading(false);
        });
  }, []);


  useEffect(() => {
    if (!grupoActivo) return;
    const grupoActualizado = grupos.find((g) => g.id === grupoActivo.id);
    if (grupoActualizado) setGrupoActivo(grupoActualizado);
  }, [grupos]);

  useEffect(() => {
    if (grupoActivo || grupos.length === 0) return;
    const storedGroupId = localStorage.getItem(SELECTED_GROUP_KEY);
    if (!storedGroupId) return;
    const restored = grupos.find((g) => g.id === storedGroupId);
    if (restored) {
      setGrupoActivo(restored);
    } else {
      localStorage.removeItem(SELECTED_GROUP_KEY);
    }
  }, [grupos, grupoActivo]);


  const login = async (email: string, password: string) => {
    const auth    = await loginRequest(email, password);
    setTokens(auth);

    const usuario = buildUserFromToken(auth.token) ?? {
      id:     '0',
      nombre: email.split('@')[0],
      email,
      rol:    'MEMBER' as const,
    };
    setUser(usuario);

    try {
      await processMyInvitations().catch(() => null);
      const mis = await getMyConsortiums();
      setGrupos(mis.map((c) => consortiumToGrupo(c, usuario.id)));
    } catch (err) {
      console.error('[AuthContext] No se pudieron cargar los grupos:', err);
      setGrupos([]);
    }

    setGrupoActivo(null);
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    setGrupos([]);
    setGrupoActivo(null);
    localStorage.removeItem(SELECTED_GROUP_KEY);
  };

  const seleccionarGrupo = (grupoId: string) => {
    const grupo = grupos.find((g) => g.id === grupoId);
    if (grupo) {
      setGrupoActivo(grupo);
      localStorage.setItem(SELECTED_GROUP_KEY, grupo.id);
    }
  };

  return (
      <AuthContext.Provider
          value={{
            user,
            grupos,
            grupoActivo,
            loading,
            login,
            logout,
            cargarGrupos,
            seleccionarGrupo,
          }}
      >
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}