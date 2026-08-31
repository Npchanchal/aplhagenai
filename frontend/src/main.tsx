import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/400-italic.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-sans/700.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/400-italic.css";
import "@fontsource/source-serif-4/600.css";
import App from "./App";
import { I18nProvider } from "./i18n";
import { AuthProvider } from "./lib/auth";
import { EntitlementsProvider } from "./lib/entitlements";
import { TourProvider } from "./lib/TourProvider";
import { SourceViewerProvider } from "./lib/SourceViewerContext";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <EntitlementsProvider>
          <TourProvider>
            <SourceViewerProvider>
              <App />
            </SourceViewerProvider>
          </TourProvider>
          </EntitlementsProvider>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
);
