import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import "./sileo-custom.css";

import AppRouter from "./routes/AppRouter";
import { ThemeProvider } from "./context/ThemeContext";

import { AuthProvider } from "./auth/AuthProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> 
        <ThemeProvider>
          <AppRouter />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
