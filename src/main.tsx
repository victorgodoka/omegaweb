import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@material-tailwind/react";
import "./styles.css";
import i18n from "./i18n";
import Loading from "@/ui/Loading";
import { router } from "./router";
import { Suspense } from "react";
import { RouterProvider } from "react-router";

// Ensure i18n is fully initialized before rendering
const renderApp = () => {
  createRoot(document.getElementById("root")!).render(
    <ThemeProvider>
      <Suspense fallback={<Loading />}>
        <RouterProvider router={router} />
      </Suspense>
    </ThemeProvider>
  );
};

// Wait for i18n to be ready
if (i18n.isInitialized) {
  renderApp();
} else {
  i18n.on('initialized', renderApp);
}

