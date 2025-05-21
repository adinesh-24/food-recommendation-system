import { createBrowserRouter } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import GeneratePlan from "@/pages/GeneratePlan";
import DietPlanDisplay from "@/pages/DietPlanDisplay";
import ProtectedRoute from "@/components/ProtectedRoute";
import About from "@/pages/About";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "generate",
        element: (
          <ProtectedRoute>
            <GeneratePlan />
          </ProtectedRoute>
        ),
      },
      {
        path: "about",
        element: <About />,
      },
      {
        path: "plans/:planId",
        element: (
          <ProtectedRoute>
            <DietPlanDisplay />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default router; 