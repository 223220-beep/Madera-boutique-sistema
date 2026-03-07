import { createBrowserRouter } from "react-router";
import { NotasListPage } from "./pages/NotasListPage";
import { CrearNotaPage } from "./pages/CrearNotaPage";
import { EditarNotaPage } from "./pages/EditarNotaPage";
import { VerNotaPage } from "./pages/VerNotaPage";
import { DisenadoresPage } from "./pages/DisenadoresPage";
import { WhatsAppPage } from "./pages/WhatsAppPage";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: NotasListPage },
      { path: "crear", Component: CrearNotaPage },
      { path: "editar/:id", Component: EditarNotaPage },
      { path: "ver/:id", Component: VerNotaPage },
      { path: "disenadores", Component: DisenadoresPage },
      { path: "whatsapp", Component: WhatsAppPage },
    ],
  },
]);