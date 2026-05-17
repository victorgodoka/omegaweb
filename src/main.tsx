import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@material-tailwind/react";
import "./styles.css";
import i18n from "./i18n";
import { router } from "./router";
import { RouterProvider } from "react-router";
import { Buffer } from 'buffer';

// Add Buffer polyfill to global scope for Node.js libraries
(window as any).global = window;
(window as any).Buffer = Buffer;

// Ensure i18n is fully initialized before rendering
const renderApp = () => {
  createRoot(document.getElementById("root")!).render(
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
};

// Wait for i18n to be ready
if (i18n.isInitialized) {
  renderApp();
} else {
  i18n.on('initialized', renderApp);
}

