import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import LoginPage from "./pages/LoginPage";
import Dashboard, { loader as DashboardLoader } from "./pages/Dashboard";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ScanFarmer, {
  loader as ScanFarmerLoader,
} from "./dashboardpages/ScanFarmer";
import Farmers, { loader as FarmerLoader } from "./dashboardpages/Farmers";
import Staffs, { loader as StaffsLoader } from "./dashboardpages/Staffs";
import Inventory, {
  loader as InventoryLoader,
} from "./dashboardpages/Inventory";
import Transactions from "./dashboardpages/Transactions";
import ProtectedRoute from "./components/ui/ProtectedRoutes";
import PublicRoute from "./components/PublicRoutes";
import Clusters, { loader as ClusterLoader } from "./dashboardpages/Clusters";
import Chairmans from "./dashboardpages/Chairmans";
import ClusterList from "./dashboardpages/ClusterList";
import FarmerAttendance from "./dashboardpages/FarmerAttendance";
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },

  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
    loader: DashboardLoader,
    children: [
      {
        path: "scanner",
        element: (
          <ProtectedRoute>
            {" "}
            <ScanFarmer />
          </ProtectedRoute>
        ),
      },
      {
        path: "scanner/:farmerId",
        element: <ScanFarmer />,
        loader: ScanFarmerLoader,
      },
      {
        path: "farmers",
        element: <Farmers />,
        loader: FarmerLoader,
      },
      {
        path: "staffs",
        element: <Staffs />,
        loader: StaffsLoader,
      },

      {
        path: "chairmans",
        element: <Chairmans />,
      },
      {
        path: "clusters",
        element: <Clusters />,
        loader: ClusterLoader,
      },
      {
        path: "inventory",
        element: <Inventory />,
        loader: InventoryLoader,
      },
      {
        path: "transactions",
        element: <Transactions />,
      },

      {
        path: "farmer_attendance",
        element: <FarmerAttendance />,
      },
      {
        path: "cluster_list",
        element: <ClusterList />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
