import { useNavigate } from "react-router";
import { notasApi } from "../utils/api";
import { NotaForm } from "../components/NotaForm";
import { NotaHeader } from "../components/NotaHeader";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

export function WhatsAppPage() {
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    try {
      await notasApi.create({
        ...data,
        viaWhatsapp: true,
      });
      toast.success("Pedido de WhatsApp registrado exitosamente");
      navigate("/");
    } catch (error) {
      toast.error("Error al registrar el pedido");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <NotaHeader showFullHeader={false} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#ff7908]">Pedido por WhatsApp</h2>
              <p className="text-gray-600">Registra pedidos recibidos vía WhatsApp</p>
            </div>
          </div>

          <Alert className="mb-6 border-green-500 bg-green-50">
            <MessageSquare className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Pedido vía WhatsApp</AlertTitle>
            <AlertDescription className="text-green-700">
              Esta nota será marcada automáticamente como pedido recibido por WhatsApp.
              Asegúrate de incluir toda la información proporcionada por el cliente.
            </AlertDescription>
          </Alert>

          <NotaForm onSubmit={handleSubmit} onCancel={() => navigate("/")} submitLabel="Registrar Pedido" />
        </div>
      </div>
    </div>
  );
}