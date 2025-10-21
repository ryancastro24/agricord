import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import supabase from "@/db/config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { HiOutlinePlusSm } from "react-icons/hi";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
import { MdOutlineManageAccounts } from "react-icons/md";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { FaBookmark } from "react-icons/fa6";
import { Input } from "@/components/ui/input";
import { useLoaderData } from "react-router-dom";
import { Trash2 } from "lucide-react";

interface Farmer {
  id: number;
  firstname: string;
  lastname: string;
  barangay: string;
  contact_number: string;
}

interface Cluster {
  id: number;
  cluster_name: string;
  category: string;
  chairman_id: string;
  barangay: string;
  users?: { firstname: string; lastname: string };
}

const categories = ["Rice", "Corn", "Vegetables", "Root Crops"];

// ✅ Loader
export async function loader() {
  try {
    const [chairmansRes, clustersRes, farmersRes, usersRes] = await Promise.all(
      [
        supabase.from("chairmans").select("*"),
        supabase.from("clusters").select(`*,users(*)`),
        supabase.from("farmers").select("*"),
        supabase.from("users").select("*"),
      ]
    );

    return {
      clusters: clustersRes.data || [],
      farmers: farmersRes.data || [],
      usersRes: usersRes.data || [],
      error:
        chairmansRes.error || clustersRes.error || farmersRes.error || null,
    };
  } catch (err) {
    console.error("Unexpected error:", err);
    return {
      clusters: [],
      farmers: [],
      usersRes: [],
      error: "Unexpected error",
    };
  }
}

const Clusters = () => {
  const { clusters, farmers, usersRes } = useLoaderData() as {
    clusters: Cluster[];
    farmers: Farmer[];
    usersRes: any[];
    error: any;
  };

  const [clusterList, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);

  const [openCluster, setOpenCluster] = useState<Cluster | null>(null);
  const [clusterFarmers, setClusterFarmers] = useState<Farmer[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newCluster, setNewCluster] = useState<Omit<Cluster, "id">>({
    cluster_name: "",
    barangay: "",
    chairman_id: "",
    category: "",
  });
  const [chairmanSearch, setChairmanSearch] = useState("");

  console.log("Loaded clusters:", clusters);
  // ✅ Simulate loader delay (show skeleton until data is ready)
  useEffect(() => {
    if (clusters && farmers) {
      setClusters(clusters);
      setTimeout(() => setLoading(false), 600); // slight delay for smooth transition
    }
  }, [clusters, farmers]);

  // ✅ Add Cluster
  const handleAddCluster = async () => {
    if (
      !newCluster.cluster_name ||
      !newCluster.barangay ||
      !newCluster.chairman_id ||
      !newCluster.category
    ) {
      alert("Please fill out all fields.");
      return;
    }

    const { data, error } = await supabase
      .from("clusters")
      .insert([
        {
          cluster_name: newCluster.cluster_name,
          barangay: newCluster.barangay,
          chairman_id: newCluster.chairman_id,
          category: newCluster.category,
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("Error adding cluster:", error);
      alert("Failed to add cluster.");
      return;
    }

    setClusters((prev) => [...prev, data]);
    setNewCluster({
      cluster_name: "",
      barangay: "",
      chairman_id: "",
      category: "",
    });
    setChairmanSearch("");
    setOpenAddDialog(false);
  };

  const loadClusterFarmers = async (clusterId: number) => {
    const { data, error } = await supabase
      .from("farmer_clusters")
      .select(
        "farmer_id, farmers(firstname, lastname, barangay, contact_number, id)"
      )
      .eq("cluster_id", clusterId);

    if (error) {
      console.error("Error loading cluster farmers:", error);
      return;
    }

    const farmerDetails = data.map((fc: any) => fc.farmers);
    setClusterFarmers(farmerDetails);
  };

  const handleAddFarmerToCluster = async () => {
    console.log("Selected Farmer ID:", selectedFarmer);
    if (!openCluster || !selectedFarmer) return;

    const { error } = await supabase.from("farmer_clusters").insert([
      {
        cluster_id: openCluster.id,
        farmer_id: selectedFarmer,
      },
    ]);

    if (error) {
      console.error("Error adding farmer:", error);
      return;
    }

    loadClusterFarmers(openCluster.id);
    setSelectedFarmer(null);
  };

  const handleRemoveFarmer = async (farmerId: number) => {
    if (!openCluster) return;

    const { error } = await supabase
      .from("farmer_clusters")
      .delete()
      .eq("cluster_id", openCluster.id)
      .eq("farmer_id", farmerId);

    if (error) {
      console.error("Error removing farmer:", error);
      return;
    }

    loadClusterFarmers(openCluster.id);
  };

  useEffect(() => {
    if (openCluster) {
      loadClusterFarmers(openCluster.id);
    }
  }, [openCluster]);

  // 🦴 Skeleton Loader
  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-10 w-32 bg-gray-200 rounded" />
        </div>

        {/* Cluster cards skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-9 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ✅ Actual content
  return (
    <div className="p-6">
      {/* Add Cluster Button */}
      <div className="flex justify-between mb-6">
        <h2 className="text-xl font-bold">Cluster Management</h2>
        <Button onClick={() => setOpenAddDialog(true)}>
          <HiOutlinePlusSm /> Add Cluster
        </Button>
      </div>

      {/* Cluster Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clusterList.map((cluster: Cluster) => (
          <Card key={cluster.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-1">
                <FaBookmark color="#00BC7D" size={15} />
                {cluster.cluster_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                <strong>Category:</strong> {cluster.category}
              </p>
              <p className="text-sm">
                <strong>Chairman:</strong>{" "}
                {cluster.users
                  ? cluster.users.firstname + " " + cluster.users?.lastname
                  : "N/A"}
              </p>
              <p className="text-sm">
                <strong>Barangay:</strong> {cluster.barangay}
              </p>
              <Button
                className="mt-3 flex items-center gap-1"
                onClick={() => setOpenCluster(cluster)}
              >
                <MdOutlineManageAccounts /> Manage
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Cluster Dialog */}
      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Cluster</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <Input
              placeholder="Cluster Name"
              value={newCluster.cluster_name}
              onChange={(e) =>
                setNewCluster({ ...newCluster, cluster_name: e.target.value })
              }
            />

            <Input
              placeholder="Barangay"
              value={newCluster.barangay}
              onChange={(e) =>
                setNewCluster({ ...newCluster, barangay: e.target.value })
              }
            />

            {/* Chairman search */}
            <div>
              <Input
                placeholder="Type chairman name"
                value={chairmanSearch}
                onChange={(e) => {
                  setChairmanSearch(e.target.value);
                }}
              />
              {chairmanSearch && (
                <div className="border rounded-md mt-1 max-h-32 overflow-y-auto">
                  {usersRes
                    .filter((c: any) =>
                      `${c.firstname} ${c.lastname}`
                        .toLowerCase()
                        .includes(chairmanSearch.toLowerCase())
                    )
                    .map((c: any) => (
                      <div
                        key={c.id}
                        className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setNewCluster({
                            ...newCluster,
                            chairman_id: c.auth_id,
                          });
                          setChairmanSearch(`${c.firstname} ${c.lastname}`);
                        }}
                      >
                        {c.firstname} {c.lastname}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <Select
              onValueChange={(val) =>
                setNewCluster({ ...newCluster, category: val })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCluster}>Add Cluster</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Cluster Dialog */}
      <Dialog open={!!openCluster} onOpenChange={() => setOpenCluster(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Manage Farmers - {openCluster?.cluster_name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Panel */}
            <div className="w-full">
              <Select onValueChange={(val) => setSelectedFarmer(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Farmer" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {farmers.map((farmer) => (
                    <SelectItem key={farmer.id} value={String(farmer.id)}>
                      {farmer.firstname} {farmer.lastname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                className="mt-3 w-full"
                onClick={handleAddFarmerToCluster}
              >
                Add Farmer
              </Button>
            </div>

            {/* Right Panel */}

            <div className="col-span-2">
              <h2 className="mb-2">List Of Farmers</h2>
              <Card>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Firstname</TableHead>
                        <TableHead>Lastname</TableHead>
                        <TableHead>Barangay</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clusterFarmers.map((farmer) => (
                        <TableRow key={farmer.id}>
                          <TableCell>{farmer.firstname}</TableCell>
                          <TableCell>{farmer.lastname}</TableCell>
                          <TableCell>{farmer.barangay}</TableCell>
                          <TableCell>{farmer.contact_number}</TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure you want to remove this farmer?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Reminders cannot be undone once removed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() =>
                                      handleRemoveFarmer(farmer.id)
                                    }
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clusters;
