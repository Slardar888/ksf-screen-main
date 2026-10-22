import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { useUser, setConfig, Page } from '@kesi/client';

import App from "./App.tsx";
import "./index.css";

const { loadUser } = useUser();
loadUser();
setConfig({
  projectId: 'kesi'
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Page>
      <App />
    </Page>
  </StrictMode>,
);
