import { Badge } from "./ui/badge";
import { CheckCircle2, DollarSign, Package, MessageSquare } from "lucide-react";

interface NotaStatusBadgesProps {
  terminada: boolean;
  pagada: boolean;
  entregada: boolean;
  pagaAlRecibir?: boolean;
  viaWhatsapp?: boolean;
  size?: "sm" | "default";
}

export function NotaStatusBadges({ 
  terminada, 
  pagada, 
  entregada, 
  pagaAlRecibir = false,
  viaWhatsapp = false,
  size = "default" 
}: NotaStatusBadgesProps) {
  const badgeClass = size === "sm" ? "text-xs px-2 py-0.5" : "";
  
  return (
    <div className="flex flex-wrap gap-1.5">
      {viaWhatsapp && (
        <Badge variant="outline" className={`${badgeClass} border-green-500 text-green-700 bg-green-50`}>
          <MessageSquare className="w-3 h-3 mr-1" />
          WhatsApp
        </Badge>
      )}
      {pagaAlRecibir && !pagada && (
        <Badge variant="outline" className={`${badgeClass} border-amber-600 text-amber-800 bg-amber-50`}>
          <DollarSign className="w-3 h-3 mr-1" />
          Paga al Recibir
        </Badge>
      )}
      {terminada && (
        <Badge variant="outline" className={`${badgeClass} border-blue-500 text-blue-700 bg-blue-50`}>
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Terminada
        </Badge>
      )}
      {pagada && (
        <Badge variant="outline" className={`${badgeClass} border-emerald-500 text-emerald-700 bg-emerald-50`}>
          <DollarSign className="w-3 h-3 mr-1" />
          Pagada
        </Badge>
      )}
      {entregada && (
        <Badge variant="outline" className={`${badgeClass} border-purple-500 text-purple-700 bg-purple-50`}>
          <Package className="w-3 h-3 mr-1" />
          Entregada
        </Badge>
      )}
    </div>
  );
}