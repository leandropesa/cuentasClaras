import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  PlusCircle,
  Wallet,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, grupos, grupoActivo, seleccionarGrupo } = useAuth();
  const isAdmin = grupoActivo?.miRol === 'ADMIN';

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">

            {/* Logo — sin navegación, solo identidad */}
            <h1 className="font-semibold">CuentasClaras</h1>

            {/* Selector de grupo — solo se muestra si hay un grupo activo */}
            {grupoActivo && (
              <>
                <span className="text-gray-300">|</span>
                <DropdownMenu>


                  <DropdownMenuTrigger>
                    <button className="flex items-center gap-2 text-sm font-medium hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-gray-100">
                      <span>{grupoActivo.nombre}</span>
                      <ChevronDown className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Mis Grupos</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {grupos.map((grupo) => (
                      <DropdownMenuItem
                        key={grupo.id}
                        onClick={() => {
                          seleccionarGrupo(grupo.id);
                          navigate('/inicio');
                        }}
                        className={grupoActivo.id === grupo.id ? 'bg-gray-100' : ''}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{grupo.nombre}</span>
                          <span className="text-xs text-gray-500">
                            {grupo.miembros?.length ?? 0} miembros ·{' '}
                            {grupo.miRol === 'ADMIN' ? 'Admin' : 'Miembro'}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate('/mis-grupos')}
                      className="gap-2"
                    >
                      <Plus className="size-4" />
                      Ver todos mis grupos
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="size-4" />
            Salir
          </Button>
        </div>
      </header>

      {/* ── Contenido ── */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-28">
        <h2 className="mb-6">{title}</h2>
        {children}
      </main>

      {/* ── Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-10">
        <div className="max-w-4xl mx-auto px-2 py-2 flex justify-around">

          <NavBtn
            active={isActive('/inicio')}
            onClick={() => navigate('/inicio')}
            icon={<Home className="size-5" />}
            label="Inicio"
          />

          <NavBtn
            active={isActive('/resumen-gastos')}
            onClick={() => navigate('/resumen-gastos')}
            icon={<FileText className="size-5" />}
            label="Gastos"
          />

          <NavBtn
            active={isActive('/cargar-gasto')}
            onClick={() => navigate('/cargar-gasto')}
            icon={<PlusCircle className="size-5" />}
            label="Carga"
          />

          <NavBtn
            active={isActive('/fondo')}
            onClick={() => navigate('/fondo')}
            icon={<Wallet className="size-5" />}
            label="Fondo"
          />

          {isAdmin && (
            <NavBtn
              active={isActive('/cuentas')}
              onClick={() => navigate('/cuentas')}
              icon={<Users className="size-5" />}
              label="Cuentas"
            />
          )}

          {isAdmin && (
            <NavBtn
              active={isActive('/validar-comprobantes')}
              onClick={() => navigate('/validar-comprobantes')}
              icon={<ClipboardCheck className="size-5" />}
              label="Validar"
            />
          )}

          {isAdmin && (
            <NavBtn
              active={isActive('/configurar-grupo')}
              onClick={() => navigate('/configurar-grupo')}
              icon={<Settings className="size-5" />}
              label="Config."
            />
          )}

        </div>
      </nav>
    </div>
  );
}

// ── Sub-componente botón de navegación ──────────────────────────────────────

function NavBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs transition-colors ${
        active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}