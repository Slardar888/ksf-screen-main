import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setConfig } from '@kesi/client';

import App from "./App.tsx";
import "./index.css";

setConfig({
  projectId: 'kesi'
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
