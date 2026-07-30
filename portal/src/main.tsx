import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";

import App from "./app/App";
import { AuthProvider } from "./auth/AuthContext";
import { LiveProvider } from "./core/live/LiveProvider";
import { installNotificationSounds } from "./core/notifications/notificationSounds";

import "./styles/globals.css";

installNotificationSounds();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(
  document.getElementById("root")!,
).render(
  <StrictMode>
    <QueryClientProvider
      client={queryClient}
    >
      <BrowserRouter>
        <AuthProvider>
          <LiveProvider>
            <App />
          </LiveProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
