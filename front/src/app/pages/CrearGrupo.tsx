import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Home, ArrowLeft, Loader2 } from 'lucide-react';
import { LogoMark } from '../components/LogoMark';
import { useAuth } from '../context/AuthContext';
import { createConsortium } from '../../services/consortiumService';
import { apiFetch } from '../../services/apiClient';
import { toast } from 'sonner';

type TipoGrupo = 'PROPIEDAD_HORIZONTAL' | 'CASA_FAMILIAR' | null;

export function CrearGrupo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoGrupo>(null);
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  const handleContinuar = async () => {
    if (!tipoSeleccionado) return;

    setCreando(true);

    if (tipoSeleccionado === 'CASA_FAMILIAR') {
      try {
        const nuevo = await apiFetch<{ id: number; invitationCode: string }>(
          '/api/family-homes',
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Sin nombre' }) }
        );
        navigate('/configurar-grupo', {
          state: {
            tipo: tipoSeleccionado,
            homeId: nuevo.id,
            invitationCode: nuevo.invitationCode,
            nombreInicial: 'Sin nombre',
          },
        });
      } catch {
        toast.error('Error al crear el grupo');
        setCreando(false);
      }
      return;
    }

    try {
      const nuevo = await createConsortium({ name: 'Sin nombre', initialBalance: 0 });
      navigate('/configurar-grupo', {
        state: {
          tipo: tipoSeleccionado,
          consortiumId: nuevo.id,
          invitationCode: nuevo.invitationCode,
          nombreInicial: 'Sin nombre',
        },
      });
    } catch {
      toast.error('Error al crear el grupo');
      setCreando(false);
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/mis-grupos')} className="gap-2">
              <ArrowLeft className="size-4" />
              Volver
            </Button>
          </div>

          <div className="text-center space-y-2">
            <h1 className="font-bold text-3xl">¿Qué tipo de espacio van a gestionar?</h1>
            <p className="text-gray-600">Seleccioná el tipo que mejor se adapte a tu situación</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {/* Propiedad Horizontal */}
            <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${
                    tipoSeleccionado === 'PROPIEDAD_HORIZONTAL'
                        ? 'ring-2 ring-blue-600 bg-blue-50'
                        : 'hover:border-blue-300'
                }`}
                onClick={() => setTipoSeleccionado('PROPIEDAD_HORIZONTAL')}
            >
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center border border-slate-600/60">
                    <LogoMark className="size-16" />
                  </div>
                </div>
                <CardTitle className="text-center">Propiedad Horizontal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-sm text-gray-600">
                  PH, edificios o condominios. Los gastos se dividen por porcentajes (expensas) o partes iguales.
                </p>
                <div className="mt-4 space-y-2">
                  {['Ideal para edificios', 'Gestión de expensas', 'División por porcentajes'].map(t => (
                      <div key={t} className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        <span>{t}</span>
                      </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Casa Familiar — ahora habilitada */}
            <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${
                    tipoSeleccionado === 'CASA_FAMILIAR'
                        ? 'ring-2 ring-green-600 bg-green-50'
                        : 'hover:border-green-300'
                }`}
                onClick={() => setTipoSeleccionado('CASA_FAMILIAR')}
            >
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-green-100">
                    <Home className="size-10 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-center">Casa Familiar / Compartida</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-sm text-gray-600">
                  Quintas, casas de veraneo o familias. Los gastos se dividen en partes iguales o por peso.
                </p>
                <div className="mt-4 space-y-2">
                  {['Ideal para casas y quintas', 'Cualquiera puede cargar gastos', 'División flexible'].map(t => (
                      <div key={t} className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                        <span>{t}</span>
                      </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            className="px-12"
            disabled={!tipoSeleccionado || creando}
            onClick={handleContinuar}
          >
            {creando ? <Loader2 className="size-4 animate-spin" /> : 'Continuar →'}
          </Button>
        </div>
      </div>
    </div>
  );
}