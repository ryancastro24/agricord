import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

// Types
interface Farmer {
  id_number: string;
  firstname: string;
  lastname: string;
  contact_number: string;
  address: string;
}

const ClusterList = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // Sample farmers data
  const farmers: Farmer[] = Array.from({ length: 42 }, (_, i) => ({
    id_number: `F${String(i + 1).padStart(3, "0")}`,
    firstname: `First${i + 1}`,
    lastname: `Last${i + 1}`,
    contact_number: `0912-345-67${i % 10}${i % 10}`,
    address: `Barangay ${i + 1}, Butuan City`,
  }));

  // Filtering + pagination
  const filteredFarmers = farmers.filter((f) =>
    `${f.firstname} ${f.lastname}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const rowsPerPage = 10;
  const totalPages = Math.ceil(filteredFarmers.length / rowsPerPage);
  const paginatedFarmers = filteredFarmers.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Cluster Name */}
      <h2 className="text-xl font-semibold">
        Cluster Name: Rice Farmers Group
      </h2>

      {/* Search Field */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <Input
          placeholder="Search farmer name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1); // reset page when searching
          }}
          className="w-full md:max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Number</TableHead>
              <TableHead>Firstname</TableHead>
              <TableHead>Lastname</TableHead>
              <TableHead>Contact Number</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFarmers.map((farmer) => (
              <TableRow key={farmer.id_number}>
                <TableCell>{farmer.id_number}</TableCell>
                <TableCell>{farmer.firstname}</TableCell>
                <TableCell>{farmer.lastname}</TableCell>
                <TableCell>{farmer.contact_number}</TableCell>
                <TableCell>{farmer.address}</TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => alert(`Report ${farmer.firstname}`)}
                      >
                        Report
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          alert(`Request removal for ${farmer.firstname}`)
                        }
                      >
                        Request for Removal
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          alert(`View details of ${farmer.firstname}`)
                        }
                      >
                        View More Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClusterList;
