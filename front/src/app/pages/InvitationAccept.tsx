import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LogoMark } from '../components/LogoMark';
import {
  acceptInvitation,
  InvitationAcceptResponse,
} from '../../services/invitationService';

export function InvitationAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InvitationAcceptResponse | null>(null);

  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  useEffect(() => {
    if (!token) {
      setError('El link de invitación es inválido o está incompleto.');
      setLoading(false);
      return;
    }

    acceptInvitation(token)
      .then((data) => {
        setResult(data);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'No se pudo aceptar la invitación.';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!loading && !error && result) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loading, error, result, navigate]);

  const title = error
    ? 'No pudimos aceptar la invitación'
    : loading
      ? 'Procesando invitación…'
      : '¡Invitación aceptada con éxito!';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-transparent flex items-center justify-center">
            <LogoMark className="size-10" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {loading && <p className="text-gray-600">Estamos validando tu invitación…</p>}

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          {!loading && !error && result && (
            <div className="space-y-2">
              <p className="text-gray-700">
                Ya sos parte de <strong>{result.consortiumName}</strong>.
              </p>
              <p className="text-gray-600 text-sm">
                Si no tenés cuenta, cuando te registres ya vas a estar en el grupo.
              </p>
              <p className="text-gray-500 text-xs">
                Serás redirigido al inicio de sesión en 5 segundos…
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
