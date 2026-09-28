import "./index.css";

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useRoutes } from "react-router";
import routes from "~react-pages";

import { SignOnGate } from "@/components/auth/SignOnGate";
import { SiteLayout } from "@/components/layout";
import { LoadingState } from "@/components/state";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import ScreenBoundary from "@/i18n/ScreenBoundary";

import RootErrorBoundary from "./pages/RootErrorBoundary";

// eslint-disable-next-line react-refresh/only-export-components
function App() {
  return (
    <LocaleProvider>
      <SiteLayout>
        <RootErrorBoundary>
          <ScreenBoundary>
            <Suspense fallback={<LoadingState />}>
              <SignOnGate>{useRoutes(routes)}</SignOnGate>
            </Suspense>
          </ScreenBoundary>
        </RootErrorBoundary>
      </SiteLayout>
    </LocaleProvider>
  );
}

const app = createRoot(document.getElementById("root")!);

app.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
