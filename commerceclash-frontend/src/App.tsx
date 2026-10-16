import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import Navigation from "./routes/index";
import { UserProvider, useUserContext } from "./context/index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,      // data stays fresh for 30 s — no redundant re-fetches
      gcTime: 5 * 60_000,     // keep unused cache in memory for 5 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { isLoggedIn, role } = useUserContext();

  return (
    <>
      <Toaster position="top-right" richColors duration={1500} />
      <BrowserRouter>
        <Navigation isLoggedIn={isLoggedIn} role={role} />
      </BrowserRouter>
    </>
  );
}

function App() {
  return (
    <div className="App">
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
