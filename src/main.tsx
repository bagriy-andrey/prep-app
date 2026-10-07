import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import UserStateProvider from "./state/UserStateProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <UserStateProvider>
        <App />
      </UserStateProvider>
    </BrowserRouter>
  </StrictMode>,
);
