import { RxDashboard } from "react-icons/rx";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TbEdit } from "react-icons/tb";
import { useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import DashboardContent from "@/dashboardpages/DashboardContent";
import {
  LuUsers,
  LuUserPen,
  LuScanQrCode,
  LuPackageCheck,
} from "react-icons/lu";
import { MdOutlineInventory } from "react-icons/md";
const Dashboard = () => {
  const { pathname } = useLocation();
  return (
    <div className=" grid grid-cols-[200px_1fr] h-screen">
      <div className="border-r-slate-200 border-1 border-opacity-25 p-2 sticky top-0 h-screen">
        <div className="rounded bg-[#e3e4d4] w-full h-12 p-2 flex items-center justify-between">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex flex-col ml-2">
              <h2 className="truncate text-sm font-bold">Jhon Doe</h2>
              <span className="text-xs">Staff</span>
            </div>
          </div>
          <div>
            <Button
              variant="secondary"
              size="icon"
              className="size-8 opacity-60 cursor-pointer hover:opacity-100"
            >
              <TbEdit />
            </Button>
          </div>
        </div>
        <nav className="space-y-4 mt-2 p-2">
          <div className="flex flex-col gap-6">
            <Link
              to={"/dashboard/"}
              className={`flex items-center ${
                pathname === "/dashboard/"
                  ? "bg-[#00c951] p-2 rounded text-white"
                  : ""
              }`}
            >
              <RxDashboard size={15} />
              <span className="text-sm ml-2">Dashboard</span>
            </Link>
            <Link
              to={"/dashboard/scanner"}
              className={`flex items-center ${
                pathname.startsWith("/dashboard/scanner")
                  ? "bg-[#00c951] p-2 rounded text-white"
                  : ""
              }`}
            >
              <LuScanQrCode size={15} />
              <span className="text-sm ml-2">Scan Farmer</span>
            </Link>

            <Link
              to={"/dashboard/farmers"}
              className={`flex items-center ${
                pathname === "/dashboard/farmers"
                  ? "bg-[#00c951] p-2 rounded text-white"
                  : ""
              }`}
            >
              <LuUsers size={15} />
              <span className="text-sm ml-2">Manage Farmers</span>
            </Link>

            <Link
              to={"/dashboard/staffs"}
              className={`flex items-center ${
                pathname === "/dashboard/staffs"
                  ? "bg-[#00c951] p-2 rounded text-white"
                  : ""
              }`}
            >
              <LuUserPen size={15} />
              <span className="text-sm ml-2">Manage Staffs</span>
            </Link>
            <Link
              to={"/dashboard/inventory"}
              className={`flex items-center ${
                pathname === "/dashboard/inventory"
                  ? "bg-[#00c951] p-2 rounded text-white"
                  : ""
              }`}
            >
              <MdOutlineInventory size={15} />
              <span className="text-sm ml-2">Item Inventory</span>
            </Link>
            <Link
              to={"/dashboard/transactions"}
              className={`flex items-center ${
                pathname === "/dashboard/transactions"
                  ? "bg-[#00c951] p-2 rounded text-white"
                  : ""
              }`}
            >
              <LuPackageCheck size={15} />
              <span className="text-sm ml-2">Transactions</span>
            </Link>
          </div>
        </nav>
      </div>
      <div className="p-2">
        <div className="w-full h-[40px] mb-2 border-b-1 flex items-center pl-4 border-b-slate-200">
          {pathname.startsWith("/dashboard/scanner") && (
            <h2 className="font-bold text-sm">Scan Farmers</h2>
          )}
          {pathname === "/dashboard/" && (
            <h2 className="font-bold text-sm">Dashboard</h2>
          )}
          {pathname === "/dashboard/farmers" && (
            <h2 className="font-bold text-sm">Manage Farmers</h2>
          )}
          {pathname === "/dashboard/staffs" && (
            <h2 className="font-bold text-sm">Manage Staffs </h2>
          )}
          {pathname === "/dashboard/inventory" && (
            <h2 className="font-bold text-sm">Items Inventory</h2>
          )}
          {pathname === "/dashboard/transactions" && (
            <h2 className="font-bold text-sm">Transactions</h2>
          )}
        </div>
        <div className="w-full h-full  shadow-xl shadow-[#00000027] rounded-lg">
          {pathname === "/dashboard/" ? (
            <>
              <DashboardContent />
            </>
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
