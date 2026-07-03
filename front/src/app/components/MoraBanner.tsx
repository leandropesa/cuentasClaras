import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { AlertTriangle, Bell } from "lucide-react";
import type { MoraNotification } from "@/services/moraService";

interface Props {
  mora: MoraNotification;
}

export function MoraBanner({ mora }: Props) {
  return (
    <div className="space-y-2 mb-4">
      <Alert variant="destructive" className="border-red-500 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="font-semibold">Cuenta en mora</AlertTitle>
        <AlertDescription>
          Tu cuenta se encuentra en mora desde el{" "}
          <strong>{mora.moraDesdeFecha ?? mora.fechaVencimiento ?? "–"}</strong>{" "}
          ({mora.diasEnMora} día{mora.diasEnMora !== 1 ? "s" : ""}). Deuda
          pendiente:{" "}
          <strong>
            ${mora.deuda.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </strong>
          . Por favor regularizá tu situación para continuar operando normalmente.
        </AlertDescription>
      </Alert>

      {mora.adminNotificado && (
        <Alert className="border-orange-400 bg-orange-50">
          <Bell className="h-4 w-4 text-orange-600" />
          <AlertTitle className="font-semibold text-orange-800">
            Notificación del administrador
          </AlertTitle>
          <AlertDescription className="text-orange-700">
            El administrador del consorcio fue informado de tu situación de mora
            y te ha enviado una notificación. Comunicate con él para regularizar tu cuenta.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
