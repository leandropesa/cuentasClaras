import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Mail, Lock, User } from 'lucide-react';
import { LogoMark } from '../components/LogoMark';
import { toast } from 'sonner';

// Tipamos lo que esperamos recibir de la API
interface RegisterResponse {
  id: number;
  nombre: string;
  email: string;
  createdAt: string;
}

export function Register() {
  const navigate = useNavigate();

  // Estado del formulario — cada campo tipado como string
  const [nombre, setNombre] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmarPassword, setConfirmarPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones antes de llamar a la API
    if (!nombre || !email || !password || !confirmarPassword) {
      toast.error('Por favor completá todos los campos');
      return;
    }

    if (password !== confirmarPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/usuarios/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Error al registrarse');
        return;
      }

      const data: RegisterResponse = await response.json();
      toast.success(`¡Bienvenido ${data.nombre}! Tu cuenta fue creada`);
      navigate('/login');

    } catch (error) {
      toast.error('No se pudo conectar con el servidor');
    } finally {
      // Esto se ejecuta siempre, haya error o no
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo — idéntico al Login */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2">
            <LogoMark className="size-9" />
          </div>
          <h1 className="font-bold text-3xl">CuentasClaras</h1>
          <p className="text-gray-600">Creá tu cuenta para empezar</p>
        </div>

        {/* Formulario */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleRegister} className="space-y-4">

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="nombre"
                    type="text"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

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
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarPassword">Confirmá tu contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="confirmarPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>
            </form>

            <Separator className="my-6" />

            {/* Link a Login */}
            <p className="text-center text-sm text-gray-600">
              ¿Ya tenés cuenta?{' '}
            </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full text-blue-600 font-medium hover:underline text-sm mt-1"
              >
                Iniciá sesión
              </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}