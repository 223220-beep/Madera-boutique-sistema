import { createBrowserRouter } from "react-router";
import { NotasListPage } from "./pages/NotasListPage";
import { CrearNotaPage } from "./pages/CrearNotaPage";
import { EditarNotaPage } from "./pages/EditarNotaPage";
import { VerNotaPage } from "./pages/VerNotaPage";
import { DisenadoresPage } from "./pages/DisenadoresPage";
import { CalendarioPage } from "./pages/CalendarioPage";
import { CajaPage } from "./pages/CajaPage";
import { Layout } from "./components/Layout";
import { ErrorPage } from "./components/ErrorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    errorElement: <ErrorPage />,
    children: [
      { index: true, Component: NotasListPage },
      { path: "crear", Component: CrearNotaPage },
      { path: "editar/:id", Component: EditarNotaPage },
      { path: "ver/:id", Component: VerNotaPage },
      { path: "disenadores", Component: DisenadoresPage },
      { path: "calendario", Component: CalendarioPage },
      { path: "caja", Component: CajaPage },
    ],
  },
]);