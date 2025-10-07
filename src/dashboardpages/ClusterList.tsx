import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/dashboardComponents/AuthContext";
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
import supabase from "@/db/config"; // adjust path to your Supabase client

// Types
interface Farmer {
  id: string | null;
  id_number: string | null;
  firstname: string | null;
  lastname: string | null;
  contact_number: string | null;
  purok: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
}

const ClusterList = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [clusterName, setClusterName] = useState<string>("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchFarmers = async () => {
      if (!user?.id) return;

      // Step 1: Get cluster(s) owned by this user
      const { data: clusters, error: clusterError } = await supabase
        .from("clusters")
        .select("id, cluster_name")
        .eq("chairman_id", user.id)
        .single(); // assuming 1 cluster per user; remove .single() if multiple

      if (clusterError) {
        console.error("Error fetching clusters:", clusterError);
        return;
      }

      if (!clusters) return;

      setClusterName(clusters.cluster_name);

      // Step 2: Get farmer clusters + farmer details
      const { data: farmerClusters, error: farmerError } = await supabase
        .from("farmer_clusters")
        .select(
          `
          farmer_id,
          farmers (
            id,
            id_number,
            firstname,
            lastname,
            contact_number,
           purok,
           barangay,
           city,
           province

          )
        `
        )
        .eq("cluster_id", clusters.id);

      if (farmerError) {
        console.error("Error fetching farmer clusters:", farmerError);
        return;
      }

      if (farmerClusters) {
        const mappedFarmers = farmerClusters.map((fc: any) => fc.farmers);
        setFarmers(mappedFarmers);
      }
    };

    fetchFarmers();
  }, [user?.id]);

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
        Cluster Name: {clusterName || "Loading..."}
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
              <TableRow key={farmer.id}>
                <TableCell>{farmer.id_number}</TableCell>
                <TableCell>{farmer.firstname}</TableCell>
                <TableCell>{farmer.lastname}</TableCell>
                <TableCell>{farmer.contact_number}</TableCell>
                <TableCell>
                  {farmer.purok} {farmer.barangay} {farmer.city}{" "}
                  {farmer.province}
                </TableCell>
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
