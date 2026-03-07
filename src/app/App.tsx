import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { SocketProvider } from "./utils/socket";
import { ConnectionStatus } from "./components/ConnectionStatus";

export default function App() {
  return (
    <SocketProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
      <ConnectionStatus />
    </SocketProvider>
  );
}
