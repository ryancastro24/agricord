"use client";

import { useState, useEffect } from "react";
import supabase from "@/db/config";
import { toast } from "sonner";
import DeleteFarmerDataDialog from "@/dashboardComponents/DeleteFarmerDataDialog";
import PrintQRCodes from "@/dashboardComponents/PrintQRCodes";
import AddCornFarmerDialog from "@/dashboardComponents/AddCornFarmerDialog";
import AddCropsFarmerDialog from "@/dashboardComponents/AddCropsFarmerDialog";
import AddLiveStockFarmerDialog from "@/dashboardComponents/AddLiveStockFarmerDialog";
import AddFisheryFarmerDialog from "@/dashboardComponents/AddFisheryFarmerDialog";
import ViewFarmersDetails from "@/dashboardComponents/ViewFarmersDetails";
import { LuDownload } from "react-icons/lu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CgMoreVertical } from "react-icons/cg";
import { Skeleton } from "@/components/ui/skeleton";

// Excel Export Libraries
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type Farmer = {
  id: string;
  id_number: string;
  firstname: string;
  lastname: string;
  barangay: string;
  city: string;
  province: string;
  contact_number: string;
  sex: string;
  birthdate?: string;
  email?: string;
  farmer_role?: string;
  farm_type?: string;
  civil_status?: string;
  date_of_birth?: string;
  bldg_no?: string;
};

export default function Farmers() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminCategory, setAdminCategory] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    city: "",
    barangay: "",
    province: "",
    gender: "",
    search: "",
  });

  const [openDeleteFarmerDialog, setOpenDeleteFarmerDialog] = useState(false);
  const [openViewFarmerDialog, setOpenViewFarmerDialog] = useState(false);

  const [deleteFarmer, setDeleteFarmer] = useState<Farmer | null>(null);
  const [viewFarmerData, setViewFarmerData] = useState<Farmer | null>(null);

  const calculateAge = (dob?: string) => {
    if (!dob) return "";
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };
  // Fetch farmers
  const fetchFarmers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("farmers").select("*");
    if (error) {
      toast.error("Error fetching farmers data.");
      console.error(error);
    } else {
      setFarmers(data || []);
    }
    setLoading(false);
  };

  const fetchUserLoginData = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (!error) {
      setAdminCategory(data?.user?.user_metadata?.category || null);
    }
  };

  useEffect(() => {
    fetchFarmers();
    fetchUserLoginData();

    const channel = supabase
      .channel("farmers-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "farmers" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setFarmers((prev) => [payload.new as Farmer, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setFarmers((prev) =>
              prev.map((f) =>
                f.id === (payload.new as Farmer).id
                  ? (payload.new as Farmer)
                  : f
              )
            );
          } else if (payload.eventType === "DELETE") {
            setFarmers((prev) =>
              prev.filter((f) => f.id !== (payload.old as Farmer).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const filteredFarmers = farmers.filter((farmer) => {
    return (
      (filters.city === "" || farmer.city === filters.city) &&
      (filters.barangay === "" || farmer.barangay === filters.barangay) &&
      (filters.province === "" || farmer.province === filters.province) &&
      (filters.gender === "" || farmer.sex === filters.gender) &&
      (filters.search === "" ||
        Object.values(farmer)
          .join(" ")
          .toLowerCase()
          .includes(filters.search.toLowerCase()))
    );
  });

  // ===== Export to Excel =====
  const exportToExcel = () => {
    if (!filteredFarmers.length) {
      toast.error("No farmers data to export.");
      return;
    }

    const worksheetData = filteredFarmers.map((f) => ({
      "ID Number": f.id_number,
      "First Name": f.firstname,
      "Last Name": f.lastname,
      "Street/Blg No.": f.bldg_no ?? "",
      Barangay: f.barangay,
      City: f.city,
      Province: f.province,
      Contact: f.contact_number,
      Gender: f.sex,
      Age: calculateAge(f.date_of_birth),
      Birthdate: f.date_of_birth ?? "",
      "Highest Education": (f as any).highest_formal_education ?? "",
      "Civil Status": f.civil_status ?? "",
      "Is with disability": (f as any).is_with_disability ? "Yes" : "No",
      "Is 4Ps Member": (f as any).is_4ps_beneficiary ? "Yes" : "No",
      "Is IP Member": (f as any).is_ip ? "Yes" : "No",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Farmers");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(data, "Farmers_Data.xlsx");
    toast.success("Farmers data exported to Excel!");
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Filters + Add + Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2 flex-1">
          <Input
            placeholder="Search..."
            value={filters.search}
            className="w-full sm:w-[200px]"
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
          {/* Filters */}
          <Select
            value={filters.city}
            onValueChange={(val) => handleFilterChange("city", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              {[...new Set(farmers.map((f) => f.city))].map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.barangay}
            onValueChange={(val) => handleFilterChange("barangay", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Barangay" />
            </SelectTrigger>
            <SelectContent>
              {[...new Set(farmers.map((f) => f.barangay))].map((brgy) => (
                <SelectItem key={brgy} value={brgy}>
                  {brgy}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.province}
            onValueChange={(val) => handleFilterChange("province", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Province" />
            </SelectTrigger>
            <SelectContent>
              {[...new Set(farmers.map((f) => f.province))].map((prov) => (
                <SelectItem key={prov} value={prov}>
                  {prov}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.gender}
            onValueChange={(val) => handleFilterChange("gender", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() =>
              setFilters({
                city: "",
                barangay: "",
                province: "",
                gender: "",
                search: "",
              })
            }
          >
            Reset
          </Button>
        </div>

        {/* Add Buttons */}
        <div className="flex items-center gap-2">
          <PrintQRCodes farmers={farmers} />
          <Button
            size={"icon"}
            variant={"outline"}
            className="cursor-pointer"
            onClick={exportToExcel}
          >
            <LuDownload size={16} />
          </Button>
          {adminCategory === "corn" || adminCategory === "all" ? (
            <AddCornFarmerDialog onSuccess={fetchFarmers} />
          ) : null}
          {adminCategory === "crops" && (
            <AddCropsFarmerDialog onSuccess={fetchFarmers} />
          )}
          {adminCategory === "livestock" && (
            <AddLiveStockFarmerDialog onSuccess={fetchFarmers} />
          )}
          {adminCategory === "fishery" && (
            <AddFisheryFarmerDialog onSuccess={fetchFarmers} />
          )}
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <Table className="min-w-full">
            <TableCaption>Farmers List</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID Number</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Barangay</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFarmers.map((farmer) => (
                <TableRow key={farmer.id}>
                  <TableCell>{farmer.id_number}</TableCell>
                  <TableCell>{farmer.firstname}</TableCell>
                  <TableCell>{farmer.lastname}</TableCell>
                  <TableCell>{farmer.barangay}</TableCell>
                  <TableCell>{farmer.city}</TableCell>
                  <TableCell>{farmer.contact_number}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-8"
                        >
                          <CgMoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuLabel>Options</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setViewFarmerData(farmer);
                            setOpenViewFarmerDialog(true);
                          }}
                        >
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDeleteFarmer(farmer);
                            setOpenDeleteFarmerDialog(true);
                          }}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialogs */}
      {deleteFarmer && (
        <DeleteFarmerDataDialog
          openDeleteFarmerDialog={openDeleteFarmerDialog}
          setOpenDeleteFarmerDialog={setOpenDeleteFarmerDialog}
          deleteFarmer={deleteFarmer}
          onSuccess={fetchFarmers}
        />
      )}

      {viewFarmerData && (
        <ViewFarmersDetails
          openViewFarmerDialog={openViewFarmerDialog}
          setOpenViewFarmerDialog={setOpenViewFarmerDialog}
          details={viewFarmerData}
        />
      )}
    </div>
  );
}
