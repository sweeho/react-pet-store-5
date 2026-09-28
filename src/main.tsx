import "./index.css";

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useRoutes } from "react-router";
import routes from "~react-pages";

import { SiteLayout } from "@/components/layout";
import { LoadingState } from "@/components/state";

import RootErrorBoundary from "./pages/RootErrorBoundary";

// eslint-disable-next-line react-refresh/only-export-components
function App() {
  return (
    <SiteLayout>
      <RootErrorBoundary>
        <Suspense fallback={<LoadingState />}>{useRoutes(routes)}</Suspense>
      </RootErrorBoundary>
    </SiteLayout>
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
