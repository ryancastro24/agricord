import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/dashboardComponents/AuthContext";
import supabase from "@/db/config";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";

const ChairmanItemReturn = () => {
  const { user } = useAuth();

  // --- Helper: format date to local YYYY-MM-DD (avoids UTC shifts) ---
  const toYMD = (d?: string | Date | null) => {
    if (!d) return "";
    const dt = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(dt.getTime())) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // filters
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState<string | undefined>();
  const [filterItem, setFilterItem] = useState<string | undefined>();
  const [clusterId, setClusterId] = useState<string | null>(null);

  // data from supabase
  const [farmers, setFarmers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [itemsReturned, setItemsReturned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // dialog states
  const [selectedFarmer, setSelectedFarmer] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<number | undefined>();
  const [selectedItem, setSelectedItem] = useState<string | undefined>();
  const [quantity, setQuantity] = useState<number | undefined>();
  const [reason, setReason] = useState<string | undefined>();

  // Step 1 → filter all transactions for selected farmer
  const farmerTransactions = selectedFarmer
    ? transactions.filter((t) => t.farmer_id === selectedFarmer)
    : [];

  // Step 2 → get unique transaction dates with transaction id (use local date)
  const availableDates = farmerTransactions.map((t) => ({
    id: t.id,
    date: toYMD(t.created_at),
  }));

  // Step 3 → filter items by transaction id instead of date
  const itemsForDate =
    selectedDate && selectedFarmer
      ? farmerTransactions
          .filter((t) => t.id === Number(selectedDate))
          .map((t) => ({
            transaction_id: t.id,
            item_id: t.item_id,
            item_name: t.items?.name ?? "Unknown Item",
          }))
      : [];

  // ✅ Fetch cluster + farmers + transactions
  useEffect(() => {
    const fetchClusterData = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // 1. Get cluster where chairman = current user
        const { data: clusterData, error: clusterError } = await supabase
          .from("clusters")
          .select("id, chairman_id")
          .eq("chairman_id", user.id)
          .single();

        if (clusterError || !clusterData) {
          console.error("Cluster error:", clusterError);
          setClusterId(null);
          setFarmers([]);
          setTransactions([]);
          return;
        }

        setClusterId(clusterData.id);

        // 2. Get farmer_cluster + farmer details
        const { data: farmerClusterData, error: farmerClusterError } =
          await supabase
            .from("farmer_clusters")
            .select(
              `
            id,
            farmer_id,
            farmers (
              id,
              firstname,
              lastname
            )
          `
            )
            .eq("cluster_id", clusterData.id);

        if (farmerClusterError) {
          console.error("Farmer cluster error:", farmerClusterError);
          setFarmers([]);
          setTransactions([]);
          return;
        }

        const farmerList = farmerClusterData.map((fc) => fc.farmers);
        setFarmers(farmerList ?? []);

        const farmerIds = farmerList.map((f: any) => f.id);
        if (farmerIds.length === 0) {
          setTransactions([]);
          return;
        }

        // 3. Get transactions + join with items
        const { data: txnData, error: txnError } = await supabase
          .from("transactions")
          .select(
            `
            id,
            farmer_id,
            item_id,
            created_at,
            items (
              id,
              name
            )
          `
          )
          .in("farmer_id", farmerIds);

        if (txnError) {
          console.error("Transaction error:", txnError);
          setTransactions([]);
          return;
        }

        setTransactions(txnData ?? []);
      } catch (err) {
        console.error("Unexpected error:", err);
        setFarmers([]);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClusterData();
  }, [user]);

  // ✅ Fetch returned items once clusterId is set
  useEffect(() => {
    const fetchReturnedItems = async () => {
      if (!clusterId) return;

      const { data: returnedItems, error: returnError } = await supabase
        .from("item_returns")
        .select(
          `
          id,
          farmer:farmer_id (
            firstname,
            lastname
          ),
          item:item_id (
            name
          ),
          transaction:transaction_id (
            created_at
          )
        `
        )
        .eq("cluster_id", clusterId);

      if (returnError) {
        console.error("Error fetching returned items:", returnError.message);
        setItemsReturned([]);
      } else {
        setItemsReturned(returnedItems || []);
      }
    };

    fetchReturnedItems();
  }, [clusterId]);

  // Insert return
  const handleAddReturn = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("item_returns")
      .insert([
        {
          farmer_id: selectedFarmer,
          item_id: selectedItem,
          transaction_id: selectedDate,
          quantity: quantity,
          reason: reason,
          cluster_id: clusterId,
        },
      ])
      .select();

    setLoading(false);

    if (error) {
      console.error("Error inserting item:", error.message);
      alert("Failed to insert item!");
    } else {
      console.log("Inserted:", data);
      alert("Item added successfully!");
      setItemsReturned((prev) => [...prev, ...data]);
    }
  };

  // --- Filter logic for table (use local YMD from toYMD) ---
  const filteredReturns = itemsReturned.filter((row) => {
    const farmerName = `${row.farmer?.firstname ?? ""} ${
      row.farmer?.lastname ?? ""
    }`.toLowerCase();
    const matchesSearch = search
      ? farmerName.includes(search.toLowerCase())
      : true;

    const txnDate = toYMD(row.transaction?.created_at);
    const matchesDate = filterDate ? txnDate === filterDate : true;

    const matchesItem = filterItem ? row.item?.name === filterItem : true;

    return matchesSearch && matchesDate && matchesItem;
  });

  // unique item options for filter dropdown
  const itemOptions = Array.from(
    new Set(itemsReturned.map((r) => r.item?.name).filter(Boolean))
  ) as string[];

  return (
    <div className="space-y-4 p-4">
      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <Input
          placeholder="Search farmer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        {/* Filter by Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filterDate ? filterDate : "Filter Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Calendar
              mode="single"
              selected={filterDate ? new Date(filterDate) : undefined}
              onSelect={(date) => setFilterDate(date ? toYMD(date) : undefined)}
            />
          </PopoverContent>
        </Popover>

        {/* Filter by Item */}
        <Select onValueChange={(val) => setFilterItem(val || undefined)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Item" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={undefined as unknown as string}>All</SelectItem>
            {itemOptions.map((itemName) => (
              <SelectItem key={itemName} value={itemName}>
                {itemName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Add Return Dialog (unchanged) */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="ml-auto">+ Add Return</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Item Return</DialogTitle>
              <DialogDescription>
                Select a farmer, then pick a date, and finally choose an item to
                return.
              </DialogDescription>
            </DialogHeader>

            {/* Form */}
            <div className="space-y-4">
              <div
                className={`grid ${
                  selectedFarmer ? "grid-cols-2" : "grid-cols-1"
                } gap-2`}
              >
                <Select onValueChange={(val) => setSelectedFarmer(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Farmer" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {farmers.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.firstname} {f.lastname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedFarmer && (
                  <Select
                    onValueChange={(val: any) => setSelectedDate(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Date" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {availableDates.map((d) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          {d.date}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedDate && (
                <Select onValueChange={setSelectedItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Item" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemsForDate.map((txn: any) => (
                      <SelectItem key={txn.item_id} value={txn.item_id}>
                        {txn.item_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Input
                type="number"
                value={quantity ?? ""}
                onChange={(e) =>
                  setQuantity(
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                placeholder="Quantity"
              />

              <Input
                value={reason ?? ""}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for return"
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={handleAddReturn} disabled={!selectedItem}>
                Submit Return
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        {loading ? (
          <p className="p-4">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Farmer Name</TableHead>
                <TableHead>Transaction Date</TableHead>
                <TableHead>Item</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReturns.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    {row.farmer?.firstname} {row.farmer?.lastname}
                  </TableCell>
                  <TableCell>
                    {toYMD(row.transaction?.created_at) || "N/A"}
                  </TableCell>
                  <TableCell>{row.item?.name ?? "Unknown Item"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default ChairmanItemReturn;
