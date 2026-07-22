import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Theme } from "@radix-ui/themes";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app";
import { AuthProvider } from "./features/auth/auth-provider";
import { queryClient } from "./lib/query-client";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme accentColor="teal" grayColor="slate" radius="large">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Theme>
  </StrictMode>
);
