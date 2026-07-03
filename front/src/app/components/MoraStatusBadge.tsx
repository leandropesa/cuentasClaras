import { Badge } from "@/app/components/ui/badge";

interface Props {
  status: "AL_DIA" | "EN_MORA";
}

export function MoraStatusBadge({ status }: Props) {
  return status === "EN_MORA" ? (
    <Badge variant="destructive">En mora</Badge>
  ) : (
    <Badge variant="outline" className="text-green-600 border-green-600">
      Al día
    </Badge>
  );
}