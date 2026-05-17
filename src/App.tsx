import { Suspense } from "react";
import "@/i18n";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NavbarWrapper from "@/components/Navbar";
import { Outlet, useMatches } from "react-router";
import Loading from "@/ui/Loading";
import { LoadingProvider } from "./contexts/LoadingContext";
import FooterContainer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthSessionGuard from "@/contexts/AuthContext/AuthSessionGuard";
import { ToastProvider } from "@/contexts/ToastContext";
import { ModalProvider } from "@/contexts/ModalContext";
import { GenesysProvider } from "@/contexts/GenesysContext";
import { CardsSearchProvider } from "@/contexts/CardsSearchContext";

const App = () => {
  const matches = useMatches();
  // Check if the last match is the NotFound route by id
  const is404 = matches.length > 0 && matches[matches.length - 1].id === "notfound";

  return (
    <LoadingProvider>
      <AuthProvider>
        <CardsSearchProvider>
          <ToastProvider>
            <AuthSessionGuard />
            <ModalProvider>
              <GenesysProvider>
                <ToastContainer />
                <main className="flex-1 flex flex-col min-h-screen">
                  {!is404 && <NavbarWrapper />}
                  <div className="flex-1">
                    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loading /></div>}>
                      <Outlet />
                    </Suspense>
                  </div>
                  {!is404 && <FooterContainer />}
                </main>
              </GenesysProvider>
            </ModalProvider>
          </ToastProvider>
        </CardsSearchProvider>
      </AuthProvider>
    </LoadingProvider>
  );
};

export default App;