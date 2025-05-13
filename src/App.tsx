import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import MyPlans from "./pages/MyPlans";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { initializeFirestoreCollections } from "./config/initFirestore";
import Navbar from "./components/Navbar";

const queryClient = new QueryClient();

const App = () => {
  // Initialize Firestore collections when the app starts
  useEffect(() => {
    const initFirestore = async () => {
      console.log("App started - initializing Firestore...");
      try {
        await initializeFirestoreCollections();
        console.log("Firestore initialization complete");
      } catch (error) {
        console.error("Failed to initialize Firestore:", error);
      }
    };
    
    initFirestore();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/generate" element={<Index />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-plans" element={<MyPlans />} />
            <Route path="/login" element={<Login />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
