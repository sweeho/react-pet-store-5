import "./index.css";

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useRoutes } from "react-router";
import routes from "~react-pages";

import { SiteLayout } from "@/components/layout";

// eslint-disable-next-line react-refresh/only-export-components
function App() {
  return (
    <SiteLayout>
      <Suspense fallback={<p>...</p>}>{useRoutes(routes)}</Suspense>
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
