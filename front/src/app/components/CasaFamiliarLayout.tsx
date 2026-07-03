import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Users, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';

interface CasaFamiliarLayoutProps {
  children: ReactNode;
  title: string;
  homeId: string | undefined;
  isAdmin?: boolean;
}

export function CasaFamiliarLayout({ children, title, homeId, isAdmin }: CasaFamiliarLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/mis-grupos')}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Volver a mis grupos"
            >
              <ArrowLeft className="size-5 text-gray-500" />
            </button>
            <h1 className="font-semibold text-green-700">CuentasClaras</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="size-4" />
            Salir
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-28">
        <h2 className="mb-6">{title}</h2>
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-10">
        <div className="max-w-4xl mx-auto px-2 py-2 flex justify-around">

          <NavBtn
            active={isActive(`/casa-familiar/${homeId}`)}
            onClick={() => navigate(`/casa-familiar/${homeId}`)}
            icon={<Home className="size-5" />}
            label="Inicio"
          />

          <NavBtn
            active={isActive(`/casa-familiar/${homeId}/cargar-gasto`)}
            onClick={() => navigate(`/casa-familiar/${homeId}/cargar-gasto`)}
            icon={<PlusCircle className="size-5" />}
            label="Cargar"
          />

          <NavBtn
            active={isActive(`/casa-familiar/${homeId}/configurar`)}
            onClick={() => navigate(`/casa-familiar/${homeId}/configurar`)}
            icon={<Users className="size-5" />}
            label="Miembros"
          />

        </div>
      </nav>
    </div>
  );
}

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
        active ? 'bg-green-700 text-white' : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
