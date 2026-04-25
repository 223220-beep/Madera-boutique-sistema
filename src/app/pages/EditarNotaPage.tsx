import { useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { notasApi } from "../utils/api";
import { Nota } from "../types/nota";
import { NotaForm } from "../components/NotaForm";
import { NotaHeader } from "../components/NotaHeader";
import { toast } from "sonner";

export function EditarNotaPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [nota, setNota] = useState<Nota | null>(null);

  useEffect(() => {
    if (id) {
      notasApi.getById(id).then((notaEncontrada) => {
        setNota(notaEncontrada);
      }).catch(() => {
        toast.error("Nota no encontrada");
        navigate("/");
      });
    }
  }, [id, navigate]);

  const handleSubmit = async (data: any) => {
    if (!id) return;

    try {
      await notasApi.update(id, data);
      toast.success("Nota actualizada exitosamente");
      navigate("/");
    } catch (error) {
      toast.error("Error al actualizar la nota");
      console.error(error);
    }
  };

  if (!nota) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <NotaHeader showFullHeader={false} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-[#ff7908]">Editar Nota #{nota.numeroNota}</h2>
          </div>
          <NotaForm
            initialData={{
              fecha: nota.fecha,
              clienteNombre: nota.clienteNombre,
              clienteTelefono: nota.clienteTelefono,
              fechaEvento: nota.fechaEvento,
              fechaEntrega: nota.fechaEntrega,
              items: nota.items,
              imagenesReferencia: nota.imagenesReferencia,
              viaWhatsapp: nota.viaWhatsapp,
              pagaAlRecibir: nota.pagaAlRecibir,
              comentarios: nota.comentarios,
            }}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/")}
            submitLabel="Actualizar Nota"
          />
        </div>
      </div>
    </div>
  );
}