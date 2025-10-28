import { useState, useEffect } from "react";
import supabase from "@/db/config";
import { toast } from "sonner";
import DeleteFarmerDataDialog from "@/dashboardComponents/DeleteFarmerDataDialog";
// import EditFarmerData from "@/dashboardComponents/EditFarmerData";
import PrintQRCodes from "@/dashboardComponents/PrintQRCodes";
import AddCornFarmerDialog from "@/dashboardComponents/AddCornFarmerDialog";
import AddCropsFarmerDialog from "@/dashboardComponents/AddCropsFarmerDialog";
import AddLiveStockFarmerDialog from "@/dashboardComponents/AddLiveStockFarmerDialog";
import AddFisheryFarmerDialog from "@/dashboardComponents/AddFisheryFarmerDialog";
import ViewFarmersDetails from "@/dashboardComponents/ViewFarmersDetails";

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
  age?: number;
  birthdate?: string;
  email?: string;
  farmer_role?: string;
  farm_type?: string;
  civil_status?: string;
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

  // Dialog states
  // const [openEditFarmerDialog, setOpenEditFarmerDialog] = useState(false);
  const [openDeleteFarmerDialog, setOpenDeleteFarmerDialog] = useState(false);
  const [openViewFarmerDialog, setOpenViewFarmerDialog] = useState(false);

  // Selected farmer data
  // const [editFarmer, setEditFarmer] = useState<Farmer | null>(null);
  const [deleteFarmer, setDeleteFarmer] = useState<Farmer | null>(null);
  const [viewFarmerData, setViewFarmerData] = useState<Farmer | null>(null);

  // Fetch all farmers
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

  // Get logged-in admin category
  const fetchUserLoginData = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (!error) {
      setAdminCategory(data?.user?.user_metadata?.category || null);
    }
  };

  // Initial + realtime setup
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

  // Filters
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

  // const handleSuccess = (msg: string) => {
  //   toast.success(msg);
  // };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Filters + Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2 flex-1">
          <Input
            placeholder="Search..."
            value={filters.search}
            className="w-full sm:w-[200px]"
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />

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

        {/* Add buttons */}
        <div className="flex items-center gap-2">
          <PrintQRCodes farmers={farmers} />
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
                        {/* <DropdownMenuItem
                          onClick={() => {
                            setEditFarmer(farmer);
                            setOpenEditFarmerDialog(true);
                          }}
                        >
                          Edit
                        </DropdownMenuItem> */}
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
      {/* {editFarmer && (
        <EditFarmerData
          openEditFarmerDialog={openEditFarmerDialog}
          setOpenEditFarmerDialog={setOpenEditFarmerDialog}
          editFarmer={editFarmer}
          onSuccess={() => handleSuccess("Farmer updated successfully!")}
        />
      )} */}

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
