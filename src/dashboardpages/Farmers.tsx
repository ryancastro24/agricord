import { useState } from "react";
import type { ActionFunction } from "react-router-dom";
import { useLoaderData } from "react-router-dom";
import supabase from "@/db/config";
import DeleteFarmerDataDialog from "@/dashboardComponents/DeleteFarmerDataDialog";
import EditFarmerData from "@/dashboardComponents/EditFarmerData";
import AddFarmerDialog from "@/dashboardComponents/AddFarmerDialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PrintQRCodes from "@/dashboardComponents/PrintQRCodes";
import { CgMoreVertical } from "react-icons/cg";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export async function loader() {
  const { data, error } = await supabase.from("farmers").select("*");

  if (error) {
    console.error("Could not fetch the data:", error);
    return { users: [], error: "Could not fetch the data" };
  }

  console.log("Fetched farmers data:", data);
  return { farmers: data || [], error: null };
}

export const action: ActionFunction = async () => {};

export default function Farmers() {
  const [openEditFarmerDialog, setOpenEditFarmerDialog] = useState(false);
  const [openDeleteFarmerDialog, setOpenDeleteFarmerDialog] = useState(false);
  const [editFarmer, setEditFarmer] = useState(null);
  const [deleteFarmer, setDeleteFarmer] = useState(null);
  const { farmers } = useLoaderData() as {
    farmers: any[];
    error: string | null;
  };
  const [filters, setFilters] = useState({
    city: "",
    barangay: "",
    province: "",
    gender: "",
    search: "",
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
  };

  // add a new farmer

  const filteredFarmers = farmers.filter((farmer) => {
    return (
      (filters.city === "" || farmer.city === filters.city) &&
      (filters.barangay === "" || farmer.barangay === filters.barangay) &&
      (filters.province === "" || farmer.province === filters.province) &&
      (filters.gender === "" || farmer.gender === filters.gender) &&
      (filters.search === "" ||
        Object.values(farmer)
          .join(" ")
          .toLowerCase()
          .includes(filters.search.toLowerCase()))
    );
  });

  return (
    <div className="p-6 space-y-4">
      {/* Filters + Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-1 mr-4">
          <Input
            placeholder="Search..."
            value={filters.search}
            className="w-[200px]"
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
          <Select
            value={filters.city} // 👈 controlled by state
            onValueChange={(val) => handleFilterChange("city", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              {/* 👈 Reset option */}
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
            Reset Filters
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* print QR Codes */}
          <PrintQRCodes farmers={farmers} />

          {/* add new farmer */}
          <AddFarmerDialog />
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <Table className="min-w-full ">
          <TableCaption>Farmers List</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID Number</TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Barangay</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
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
                <TableCell>
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
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Options</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setOpenEditFarmerDialog(true);
                          setEditFarmer(farmer);
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>View</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setOpenDeleteFarmerDialog(true);
                          setDeleteFarmer(farmer);
                        }}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* end of edit farmer */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <EditFarmerData
          openEditFarmerDialog={openEditFarmerDialog}
          setOpenEditFarmerDialog={setOpenEditFarmerDialog}
          editFarmer={editFarmer}
        />

        <DeleteFarmerDataDialog
          openDeleteFarmerDialog={openDeleteFarmerDialog}
          setOpenDeleteFarmerDialog={setOpenDeleteFarmerDialog}
          deleteFarmer={deleteFarmer}
        />
      </div>
    </div>
  );
}
