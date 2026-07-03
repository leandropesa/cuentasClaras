import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, Lock } from 'lucide-react';
import { LogoMark } from '../components/LogoMark';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

console.log("ENV:", import.meta.env);
console.log("API_URL:", import.meta.env.VITE_API_URL);

export function Login() {
  const navigate         = useNavigate();
  const { login }        = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Por favor completá todos los campos');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('¡Bienvenido!');
      navigate('/mis-grupos');
    } catch (error) {
      const message =
          error instanceof Error && error.message
              ? error.message
              : 'Error al iniciar sesión';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">

          {/* Logo */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2">
              <LogoMark className="size-18" />
            </div>
            <h1 className="font-bold text-3xl">CuentasClaras</h1>
            <p className="text-gray-600">
              Gestión de gastos compartidos simple y transparente
            </p>
          </div>

          {/* Formulario */}
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-4">

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        autoComplete="current-password"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Ingresando...' : 'Ingresar'}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm text-gray-600">
                ¿No tenés cuenta?{' '}
                <button
                    type="button"
                    onClick={() => navigate('/registro')}
                    className="text-blue-600 font-medium hover:underline"
                >
                  Registrate
                </button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
  );
}