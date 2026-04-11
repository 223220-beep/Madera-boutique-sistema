import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { SocketProvider } from "./utils/socket";
import { ConnectionStatus } from "./components/ConnectionStatus";

export default function App() {
  return (
    <SocketProvider>
      <div
        className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.03]"
        style={{
          backgroundImage: 'url(/favicon.svg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '40%'
        }}
      />
      <div className="relative z-10 min-h-screen">
        <RouterProvider router={router} />
        <Toaster position="top-right" />
        <ConnectionStatus />
      </div>
    </SocketProvider>
  );
}
