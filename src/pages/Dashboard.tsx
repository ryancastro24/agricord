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
  LuChevronDown,
  LuFileCheck2,
  LuTractor,
} from "react-icons/lu";
import { useLoaderData } from "react-router-dom";
import { MdOutlineInventory } from "react-icons/md";
import DashboardContent from "@/dashboardpages/DashboardContent";
import { useState } from "react";
import { Menu } from "lucide-react";
import { BsPersonCheck } from "react-icons/bs";
import { TbCheckupList, TbReportAnalytics } from "react-icons/tb";
import { FiLogOut } from "react-icons/fi";
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
import { VscGitPullRequest } from "react-icons/vsc";

export async function loader() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return { user: null };
  return { data };
}

const Dashboard = () => {
  const { pathname } = useLocation();
  const { data } = useLoaderData();
  const navigate = useNavigate();

  const role = data?.user?.user_metadata?.role || "guest";

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    General: true,
  });
  const [openMobileGroups, setOpenMobileGroups] = useState<
    Record<string, boolean>
  >({
    General: true,
  });

  const toggleGroup = (group: string, mobile = false) => {
    if (mobile) {
      setOpenMobileGroups((p) => ({ ...p, [group]: !p[group] }));
    } else {
      setOpenGroups((p) => ({ ...p, [group]: !p[group] }));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const groupedMenu = [
    {
      group: "General",
      items: [
        {
          to: "/dashboard/",
          icon: <RxDashboard size={20} />,
          label: "Dashboard",
          roles: ["admin", "staff", "chairman"],
        },
        {
          to: "/dashboard/scanner",
          icon: <LuScanQrCode size={20} />,
          label: "Scan Farmer",
          roles: ["chairman", "staff"],
        },
      ],
    },
    {
      group: "People",
      items: [
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
      ],
    },
    {
      group: "Inventory & Items",
      items: [
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
          to: "/dashboard/admin_item_request_approvals",
          icon: <LuFileCheck2 size={20} />,
          label: "Requested Items",
          roles: ["admin", "staff"],
        },
        {
          to: "/dashboard/chairman_item_return",
          icon: <GoPackageDependencies size={20} />,
          label: "Item Returns",
          roles: ["chairman"],
        },
        {
          to: "/dashboard/chairman_requests",
          icon: <VscGitPullRequest size={20} />,
          label: "Item Requests",
          roles: ["chairman"],
        },
      ],
    },
    {
      group: "Clusters",
      items: [
        {
          to: "/dashboard/clusters",
          icon: <PiBookmarks size={20} />,
          label: "Clusters",
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
      ],
    },
    {
      group: "Machinery",
      items: [
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
      ],
    },
    {
      group: "Reports",
      items: [
        {
          to: "/dashboard/borrow_summary",
          icon: <TbReportAnalytics size={20} />,
          label: "Rent Summary",
          roles: ["admin", "staff"],
        },
      ],
    },
  ];

  const renderMenu = (mobile = false) =>
    groupedMenu.map(({ group, items }) => {
      const filtered = items.filter((i) => i.roles.includes(role));
      if (!filtered.length) return null;

      const isOpen = mobile ? openMobileGroups[group] : openGroups[group];

      return (
        <div key={group}>
          <button
            onClick={() => toggleGroup(group, mobile)}
            className="flex w-full items-center justify-between px-2 py-1 text-sm font-semibold uppercase opacity-70"
          >
            {group}
            <LuChevronDown
              className={`transition ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <div className="space-y-1">
              {filtered.map(({ to, icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => mobile && setIsSidebarOpen(false)}
                  className={`flex items-center p-2 rounded text-sm ${
                    pathname === to
                      ? "bg-[#00c951] text-white"
                      : "hover:bg-slate-100"
                  }`}
                >
                  {icon}
                  <span className="ml-2">{label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    });

  return (
    <div className="flex h-full w-full">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col border-r p-2 bg-white">
        <div className="rounded bg-[#e3e4d4] w-full h-14 p-2 flex items-center">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="ml-2">
            <h2 className="text-sm font-bold truncate">
              {data?.user?.user_metadata?.lastname}
            </h2>
            <span className="text-xs capitalize">{role}</span>
          </div>
        </div>
        {renderMenu()}
      </aside>

      {/* MOBILE SIDEBAR */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-white p-3 overflow-y-auto flex flex-col justify-between h-full">
            <div>{renderMenu(true)}</div>
            {/* Mobile Logout Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="w-full mt-4 flex items-center justify-center gap-2"
                  variant="secondary"
                >
                  <FiLogOut /> Logout
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
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </aside>
        </div>
      )}

      {/* MAIN */}
      <div className="flex-1 flex flex-col">
        <header className="h-12 border-b flex items-center justify-between px-3">
          {/* Left: Avatar + User Info */}
          <div className="flex items-center gap-2"></div>

          {/* Right: Burger button (mobile only) and Logout (desktop only) */}
          <div className="flex items-center gap-2">
            {/* Mobile burger button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu />
            </Button>

            {/* Desktop Logout */}
            <div className="hidden md:flex">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="secondary">
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
                      onClick={handleLogout}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </header>

        <main className="flex-1 p-2 overflow-y-auto">
          {pathname === "/dashboard/" ? <DashboardContent /> : <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
