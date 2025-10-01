import { RxDashboard } from "react-icons/rx";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import { GrGroup } from "react-icons/gr";
import { PiBookmarks } from "react-icons/pi";
import supabase from "@/db/config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LuUsers,
  LuUserPen,
  LuScanQrCode,
  LuPackageCheck,
} from "react-icons/lu";
import { useLoaderData } from "react-router-dom";
import { PiBellRingingBold } from "react-icons/pi";
import { MdOutlineInventory } from "react-icons/md";
import DashboardContent from "@/dashboardpages/DashboardContent";
import { useState } from "react";
import { Menu } from "lucide-react";
import { BsPersonCheck } from "react-icons/bs";
import { TbCheckupList } from "react-icons/tb";
import { FiLogOut } from "react-icons/fi";

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

  // Logout function
  // Logout function
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    } else {
      // Force clear session (extra security)
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.removeItem("supabase.auth.token");

      // Or clear everything if you prefer
      // localStorage.clear();
      // sessionStorage.clear();

      navigate("/");
    }
  };

  // Define all possible menu items
  const allMenuItems = [
    {
      to: "/dashboard/",
      icon: <RxDashboard size={15} />,
      label: "Dashboard",
      roles: ["admin"],
    },
    {
      to: "/dashboard/scanner",
      icon: <LuScanQrCode size={15} />,
      label: "Scan Farmer",
      roles: ["admin", "chairman"],
    },
    {
      to: "/dashboard/farmers",
      icon: <LuUsers size={15} />,
      label: "Manage Farmers",
      roles: ["admin"],
    },
    {
      to: "/dashboard/staffs",
      icon: <LuUserPen size={15} />,
      label: "Manage Staffs",
      roles: ["admin", "staff"],
    },
    {
      to: "/dashboard/chairmans",
      icon: <GrGroup size={15} />,
      label: "Chairmans",
      roles: ["admin"],
    },
    {
      to: "/dashboard/clusters",
      icon: <PiBookmarks size={15} />,
      label: "Clusters",
      roles: ["admin", "staff"],
    },
    {
      to: "/dashboard/inventory",
      icon: <MdOutlineInventory size={15} />,
      label: "Item Inventory",
      roles: ["admin", "staff"],
    },
    {
      to: "/dashboard/transactions",
      icon: <LuPackageCheck size={15} />,
      label: "Transactions",
      roles: ["admin", "staff"],
    },
    {
      to: "/dashboard/farmer_attendance",
      icon: <BsPersonCheck size={15} />,
      label: "Farmer Attendance",
      roles: ["admin", "chairman"],
    },
    {
      to: "/dashboard/cluster_list",
      icon: <TbCheckupList size={15} />,
      label: "Cluster List",
      roles: ["admin", "chairman"],
    },
  ];

  // Filter items by role
  const menuItems = allMenuItems.filter((item) => item.roles.includes(role));

  return (
    <div className="flex h-full w-full font-[Montserrat]">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-60 border-r border-slate-200 p-2 sticky top-0 h-screen bg-white">
        {/* User Info */}
        <div className="rounded bg-[#e3e4d4] w-full h-14 p-2 flex items-center justify-between">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex flex-col ml-2">
              <h2 className="truncate text-sm font-bold">
                {data.user.user_metadata.lastname}
              </h2>
              <span className="text-xs capitalize">{role}</span>
            </div>
          </div>
        </div>
        {/* Menu */}
        <nav className="space-y-4 mt-4 px-2 flex flex-col">
          {menuItems.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center p-2 rounded text-sm transition ${
                pathname === to || pathname.startsWith(to)
                  ? "bg-[#00c951] text-white"
                  : "hover:bg-slate-100"
              }`}
            >
              {icon}
              <span className="ml-2">{label}</span>
            </Link>
          ))}
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
                    {data.user.user_metadata.lastname}
                  </h2>
                  <span className="text-xs capitalize">{role}</span>
                </div>
              </div>
            </div>
            <nav className="flex flex-col gap-3">
              {menuItems.map(({ to, icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center p-2 rounded text-sm transition ${
                    pathname === to || pathname.startsWith(to)
                      ? "bg-[#00c951] text-white"
                      : "hover:bg-slate-100"
                  }`}
                >
                  {icon}
                  <span className="ml-2">{label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="w-full h-12 border-b flex items-center px-4 justify-between bg-white shadow-sm">
          <h2 className="font-bold text-sm">
            {pathname.startsWith("/dashboard/scanner") && "Scan Farmers"}
            {pathname === "/dashboard/" && "Dashboard"}
            {pathname === "/dashboard/farmers" && "Manage Farmers"}
            {pathname === "/dashboard/staffs" && "Manage Staffs"}
            {pathname === "/dashboard/chairmans" && "Manage Chairmans"}
            {pathname === "/dashboard/inventory" && "Items Inventory"}
            {pathname === "/dashboard/transactions" && "Transactions"}
            {pathname === "/dashboard/clusters" && "Clusters"}
            {pathname === "/dashboard/farmer_attendance" && "Farmer Attendance"}
            {pathname === "/dashboard/cluster_list" && "Cluster List"}
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

            <Dialog>
              <DialogTrigger>
                <Button className="relative" size="icon" variant="secondary">
                  <PiBellRingingBold className="animate-bounce" />
                  <div className="w-2 h-2 rounded-full absolute bottom-0 left-0 bg-red-500"></div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Notifications</DialogTitle>
                  <DialogDescription>
                    No new notifications available.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
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

            {/* Notifications */}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 h-full p-2 overflow-y-auto">
          <div className="w-full h-full shadow-xl shadow-[#00000027] md:rounded-lg md:p-4">
            {pathname === "/dashboard/" ? <DashboardContent /> : <Outlet />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
