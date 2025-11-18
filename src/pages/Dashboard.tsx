import { RxDashboard } from "react-icons/rx";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PiBookmarks } from "react-icons/pi";
import supabase from "@/db/config";

import {
  LuUsers,
  LuUserPen,
  LuScanQrCode,
  LuPackageCheck,
} from "react-icons/lu";
import { useLoaderData } from "react-router-dom";
import { MdOutlineInventory } from "react-icons/md";
import DashboardContent from "@/dashboardpages/DashboardContent";
import { useState } from "react";
import { Menu } from "lucide-react";
import { BsPersonCheck } from "react-icons/bs";
import { TbCheckupList } from "react-icons/tb";
import { FiLogOut } from "react-icons/fi";
import { LuTractor } from "react-icons/lu";
import { PiHandshake } from "react-icons/pi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { GoPackageDependencies } from "react-icons/go";
import { TbReportAnalytics } from "react-icons/tb";

export async function loader() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Error fetching user:", error);
    return { user: null, error: "Could not fetch user" };
  }
  return { data };
}

const Dashboard = () => {
  const { pathname } = useLocation();
  const { data } = useLoaderData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const role = data?.user?.user_metadata?.role || "guest";

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    } else {
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.removeItem("supabase.auth.token");
      navigate("/");
    }
  };

  const allMenuItems = [
    {
      to: "/dashboard/",
      icon: <RxDashboard size={20} />,
      label: "Dashboard",
      roles: ["admin"],
    },
    {
      to: "/dashboard/scanner",
      icon: <LuScanQrCode size={20} />,
      label: "Scan Farmer",
      roles: ["chairman", "staff"],
    },
    {
      to: "/dashboard/farmers",
      icon: <LuUsers size={20} />,
      label: "Manage Farmers",
      roles: ["admin"],
    },
    {
      to: "/dashboard/staffs",
      icon: <LuUserPen size={20} />,
      label: "Manage Staffs",
      roles: ["admin"],
    },
    {
      to: "/dashboard/clusters",
      icon: <PiBookmarks size={20} />,
      label: "Clusters",
      roles: ["admin", "staff"],
    },
    {
      to: "/dashboard/inventory",
      icon: <MdOutlineInventory size={20} />,
      label: "Item Inventory",
      roles: ["admin", "staff"],
    },
    {
      to: "/dashboard/transactions",
      icon: <LuPackageCheck size={20} />,
      label: "Transactions",
      roles: ["admin", "staff"],
    },
    {
      to: "/dashboard/farmer_attendance",
      icon: <BsPersonCheck size={20} />,
      label: "Farmer Attendance",
      roles: ["chairman"],
    },
    {
      to: "/dashboard/cluster_list",
      icon: <TbCheckupList size={20} />,
      label: "Cluster List",
      roles: ["chairman"],
    },
    {
      to: "/dashboard/chairman_item_return",
      icon: <GoPackageDependencies size={20} />,
      label: "Item Returns",
      roles: ["chairman"],
    },
    {
      to: "/dashboard/machinery_inventory",
      icon: <LuTractor size={20} />,
      label: "Machinery Inventory",
      roles: ["admin"],
    },
    {
      to: "/dashboard/machinery_borrow",
      icon: <PiHandshake size={20} />,
      label: "Rent Machine",
      roles: ["admin", "staff"],
    },
    {
      to: "/dashboard/borrow_summary",
      icon: <TbReportAnalytics size={20} />,
      label: "Rent Summary",
      roles: ["admin", "staff"],
    },
  ];

  const menuItems = allMenuItems.filter((item) => item.roles.includes(role));

  return (
    <div className="flex h-full w-full font-[Montserrat] ">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-60 border-r border-slate-200  bg-white p-2 sticky top-0 h-screen ">
        <div className="rounded bg-[#e3e4d4] w-full h-14 p-2 flex items-center justify-between">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex flex-col ml-2">
              <h2 className="truncate text-sm font-bold">
                {data?.user?.user_metadata?.lastname}
              </h2>
              <span className="text-xs capitalize">{role}</span>
            </div>
          </div>
        </div>

        <nav className="space-y-4 mt-4 px-2 flex flex-col">
          {menuItems.map(({ to, icon, label }) => {
            const isActive = pathname === to; // ✅ Exact match logic
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center p-2 rounded text-sm transition ${
                  isActive ? "bg-[#00c951] text-white" : "hover:bg-slate-100"
                }`}
              >
                {icon}
                <span className="ml-2">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black opacity-40"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative bg-white w-64 h-full shadow-lg p-4">
            <div className="mb-4">
              <div className="flex items-center">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="flex flex-col ml-2">
                  <h2 className="truncate text-sm font-bold">
                    {data?.user?.user_metadata?.lastname}
                  </h2>
                  <span className="text-xs capitalize">{role}</span>
                </div>
              </div>
            </div>
            <nav className="flex flex-col gap-3">
              {menuItems.map(({ to, icon, label }) => {
                const isActive = pathname === to; // ✅ Exact match logic (mobile too)
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center p-2 rounded text-sm transition ${
                      isActive
                        ? "bg-[#00c951] text-white"
                        : "hover:bg-slate-100"
                    }`}
                  >
                    {icon}
                    <span className="ml-2">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="w-full h-12 border-b flex items-center px-4 justify-between bg-white shadow-sm">
          <h2 className="font-bold text-sm">
            {pathname === "/dashboard/scanner" && "Scan Farmers"}
            {pathname === "/dashboard/" && "Dashboard"}
            {pathname === "/dashboard/farmers" && "Manage Farmers"}
            {pathname === "/dashboard/staffs" && "Manage Staffs"}
            {pathname === "/dashboard/chairmans" && "Manage Chairmans"}
            {pathname === "/dashboard/inventory" && "Items Inventory"}
            {pathname === "/dashboard/transactions" && "Transactions"}
            {pathname === "/dashboard/clusters" && "Clusters"}
            {pathname === "/dashboard/farmer_attendance" && "Farmer Attendance"}
            {pathname === "/dashboard/cluster_list" && "Cluster List"}
            {pathname === "/dashboard/chairman_item_return" && "Item Returns"}
          </h2>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu />
            </Button>

            {/* Logout Confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8 opacity-60 cursor-pointer hover:opacity-100"
                >
                  <FiLogOut />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to log out?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500 hover:bg-red-600"
                    onClick={handleLogout}
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 h-full  p-2 overflow-y-auto">
          <div className="w-full h-full shadow-xl shadow-[#00000027] md:rounded-lg md:p-4">
            {pathname === "/dashboard/" ? <DashboardContent /> : <Outlet />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
