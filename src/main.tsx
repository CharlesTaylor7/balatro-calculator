import { StrictMode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

// eslint-disable-next-line no-type-assertion/no-type-assertion
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </StrictMode>,
);
