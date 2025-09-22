import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ScanFarmer, {
  loader as ScanFarmerLoader,
} from "./dashboardpages/ScanFarmer";
import Farmers, { loader as FarmerLoader } from "./dashboardpages/Farmers";
import Staffs from "./dashboardpages/Staffs";
import Inventory, {
  loader as InventoryLoader,
} from "./dashboardpages/Inventory";
import Transactions from "./dashboardpages/Transactions";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },

  {
    path: "/dashboard",
    element: <Dashboard />,
    children: [
      {
        path: "scanner",
        element: <ScanFarmer />,
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
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
