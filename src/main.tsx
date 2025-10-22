import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import LoginPage from "./pages/LoginPage";
import Dashboard, { loader as DashboardLoader } from "./pages/Dashboard";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ScanFarmer, {
  loader as ScanFarmerLoader,
} from "./dashboardpages/ScanFarmer";
import Farmers from "./dashboardpages/Farmers";
import Staffs, { loader as StaffsLoader } from "./dashboardpages/Staffs";
import Inventory from "./dashboardpages/Inventory";
import Transactions from "./dashboardpages/Transactions";
import ProtectedRoute from "./components/ui/ProtectedRoutes";
import PublicRoute from "./components/PublicRoutes";
import Clusters, { loader as ClusterLoader } from "./dashboardpages/Clusters";
import Chairmans from "./dashboardpages/Chairmans";
import ClusterList from "./dashboardpages/ClusterList";
import FarmerAttendance from "./dashboardpages/FarmerAttendance";
import ChairmanItemReturn from "./dashboardpages/ChairmanItemReturn";
import { AuthProvider } from "./dashboardComponents/AuthContext";
import GenerateItemPDF from "./dashboardComponents/GenerateItemPDF";
import MachineryInventory from "./dashboardpages/MachineryInventory";
import BorrowMachine from "./dashboardpages/BorrowMachine";
import { Toaster } from "sonner";
import MachineBorrowSummary from "./dashboardpages/MachineBorrowSummary";
import NotfoundPages from "./pages/NotFoundErrorPages";
const router = createBrowserRouter([
  // 👇 Public Login Route
  {
    path: "/",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },

  // 👇 Dashboard Base Layout (any logged-in user)
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
    loader: DashboardLoader,
    children: [
      // 👇 CHAIRMAN ROUTES
      {
        path: "scanner",
        element: (
          <ProtectedRoute allowedRoles={["chairman", "staff"]}>
            <ScanFarmer />
          </ProtectedRoute>
        ),
        loader: ScanFarmerLoader,
      },

      // 👇 CHAIRMAN ROUTES
      {
        path: "scanner/:farmerId",
        element: (
          <ProtectedRoute allowedRoles={["chairman", "staff"]}>
            <ScanFarmer />
          </ProtectedRoute>
        ),
        loader: ScanFarmerLoader,
      },

      {
        path: "farmer_attendance",
        element: (
          <ProtectedRoute allowedRoles={["chairman"]}>
            <FarmerAttendance />
          </ProtectedRoute>
        ),
      },
      {
        path: "cluster_list",
        element: (
          <ProtectedRoute allowedRoles={["chairman"]}>
            <ClusterList />
          </ProtectedRoute>
        ),
      },
      {
        path: "chairman_item_return",
        element: (
          <ProtectedRoute allowedRoles={["chairman"]}>
            <ChairmanItemReturn />
          </ProtectedRoute>
        ),
      },

      // 👇 ADMIN ROUTES
      {
        path: "farmers",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Farmers />
          </ProtectedRoute>
        ),
      },
      {
        path: "staffs",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <Staffs />
          </ProtectedRoute>
        ),
        loader: StaffsLoader,
      },
      {
        path: "machinery_inventory",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <MachineryInventory />
          </ProtectedRoute>
        ),
      },

      // 👇 ADMIN + STAFF ROUTES
      {
        path: "clusters",
        element: (
          <ProtectedRoute allowedRoles={["admin", "staff"]}>
            <Clusters />
          </ProtectedRoute>
        ),
        loader: ClusterLoader,
      },
      {
        path: "inventory",
        element: (
          <ProtectedRoute allowedRoles={["admin", "staff"]}>
            <Inventory />
          </ProtectedRoute>
        ),
      },
      {
        path: "transactions",
        element: (
          <ProtectedRoute allowedRoles={["admin", "staff"]}>
            <Transactions />
          </ProtectedRoute>
        ),
      },
      {
        path: "machinery_borrow",
        element: (
          <ProtectedRoute allowedRoles={["admin", "staff"]}>
            <BorrowMachine />
          </ProtectedRoute>
        ),
      },
      {
        path: "borrow_summary",
        element: (
          <ProtectedRoute allowedRoles={["admin", "staff"]}>
            <MachineBorrowSummary />
          </ProtectedRoute>
        ),
      },

      // 👇 COMMON ROUTES (ALL ROLES)
      {
        path: "chairmans",
        element: (
          <ProtectedRoute allowedRoles={["admin", "staff"]}>
            <Chairmans />
          </ProtectedRoute>
        ),
      },
      {
        path: "item-pdf/:id",
        element: (
          <ProtectedRoute allowedRoles={["admin", "staff", "chairman"]}>
            <GenerateItemPDF />
          </ProtectedRoute>
        ),
      },

      // ✅ Catch-all inside dashboard
      { path: "*", element: <NotfoundPages /> },
    ],
  },

  // ✅ Global Catch-all 404
  { path: "*", element: <NotfoundPages /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  </StrictMode>
);
