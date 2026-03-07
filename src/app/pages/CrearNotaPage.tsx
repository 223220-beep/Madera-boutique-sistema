import { useNavigate } from "react-router";
import { notasApi } from "../utils/api";
import { NotaForm } from "../components/NotaForm";
import { NotaHeader } from "../components/NotaHeader";
import { toast } from "sonner";

export function CrearNotaPage() {
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    try {
      await notasApi.create(data);
      toast.success("Nota creada exitosamente");
      navigate("/");
    } catch (error) {
      toast.error("Error al crear la nota");
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
          <h2 className="text-3xl font-bold text-[#ff7908] mb-6">Nueva Nota de Pedido</h2>
          <NotaForm onSubmit={handleSubmit} onCancel={() => navigate("/")} submitLabel="Crear Nota" />
        </div>
      </div>
    </div>
  );
}