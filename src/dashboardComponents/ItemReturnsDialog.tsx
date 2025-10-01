import { useState, useMemo } from "react";
import supabase from "@/db/config"; // ✅ Make sure you import your supabase client
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { GoPackageDependencies } from "react-icons/go";
import { MoreHorizontal } from "lucide-react";

// Type for a single item return row
interface ItemReturn {
  id: string | number;
  farmers?: {
    firstname?: string;
    lastname?: string;
  };
  clusters?: {
    cluster_name?: string;
  };
  items?: {
    id?: string | number;
    name?: string;
    quantity?: number;
  };
  quantity?: number;
  created_at: string;
  reason?: string;
  status?: string;
}

// Helper to format date as MM-DD-YYYY
const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return ""; // handle invalid date
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${month}-${day}-${year}`;
};

const ItemReturnsDialog = ({
  item_returns,
}: {
  item_returns: ItemReturn[];
}) => {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [clusterFilter, setClusterFilter] = useState("all");
  const [returns, setReturns] = useState<ItemReturn[]>(item_returns);

  // Get unique clusters dynamically
  const clusters: string[] = Array.from(
    new Set(returns.map((item) => item?.clusters?.cluster_name).filter(Boolean))
  ) as string[];

  // Filtering logic
  const filteredReturns = useMemo(() => {
    return returns.filter((item) => {
      const farmerName = `${item?.farmers?.firstname ?? ""} ${
        item?.farmers?.lastname ?? ""
      }`.toLowerCase();
      const itemName = item?.items?.name?.toLowerCase() ?? "";
      const searchMatch =
        farmerName.includes(search.toLowerCase()) ||
        itemName.includes(search.toLowerCase());

      const formattedDate = formatDate(item?.created_at);
      const dateMatch =
        dateFilter !== null
          ? formattedDate === formatDate(dateFilter.toISOString())
          : true;

      const clusterMatch =
        clusterFilter === "all" ||
        item?.clusters?.cluster_name === clusterFilter;

      return searchMatch && dateMatch && clusterMatch;
    });
  }, [returns, search, dateFilter, clusterFilter]);

  // Update status handler
  const handleAction = async (
    action: "returned" | "onhold" | "rejected",
    item_return: ItemReturn
  ) => {
    try {
      // 1. Fetch latest return + related item
      const { data: currentReturn, error: fetchError } = await supabase
        .from("item_returns")
        .select("status, quantity, items(id, quantity)")
        .eq("id", item_return.id)
        .single<{
          status: string | null;
          quantity: number | null;
          items: {
            id: string | number;
            quantity: number | null;
          } | null;
        }>();

      if (fetchError) throw fetchError;
      if (!currentReturn) throw new Error("Return not found");

      const currentStatus = currentReturn.status ?? null;
      const currentItem = currentReturn.items;
      const currentItemQty = Number(currentItem?.quantity ?? 0);
      const returnQty = Number(currentReturn.quantity ?? 0);

      // 2. Handle stock adjustment
      if (action === "returned" && currentStatus !== "returned") {
        // ✅ Add back only if not already returned
        const newQuantity = currentItemQty + returnQty;
        if (currentItem?.id) {
          const { error: updateItemError } = await supabase
            .from("items")
            .update({ quantity: newQuantity })
            .eq("id", currentItem.id);
          if (updateItemError) throw updateItemError;
        }
      }

      if (
        (action === "onhold" || action === "rejected") &&
        currentStatus === "returned"
      ) {
        // ✅ Subtract only if it was previously returned
        const newQuantity = currentItemQty - returnQty;
        if (currentItem?.id) {
          const { error: updateItemError } = await supabase
            .from("items")
            .update({ quantity: newQuantity })
            .eq("id", currentItem.id);
          if (updateItemError) throw updateItemError;
        }
      }

      // 3. Update item_returns.status
      const { error: updateReturnError } = await supabase
        .from("item_returns")
        .update({ status: action })
        .eq("id", item_return.id);

      if (updateReturnError) throw updateReturnError;

      // 4. Update local state
      setReturns((prev) =>
        prev.map((r) =>
          r.id === item_return.id ? { ...r, status: action } : r
        )
      );
    } catch (err) {
      console.error("Action failed:", err);
    }
  };

  // Row background color based on status
  const getRowClass = (status?: string) => {
    switch (status) {
      case "returned":
        return "bg-green-100";
      case "rejected":
        return "bg-red-100";
      case "onhold":
        return "bg-yellow-100";
      default:
        return "";
    }
  };

  return (
    <Dialog>
      <DialogTrigger>
        <Button size={"icon"} variant={"secondary"}>
          <GoPackageDependencies />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>Item Returns</DialogTitle>
        </DialogHeader>

        {/* Search + Filters */}
        <div className="flex flex-col md:flex-row gap-2 py-2">
          {/* Search */}
          <Input
            placeholder="Search by farmer or item name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />

          {/* Cluster Filter */}
          <Select
            value={clusterFilter}
            onValueChange={(val) => setClusterFilter(val)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Cluster" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clusters</SelectItem>
              {clusters.map((c, i) => (
                <SelectItem key={i} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filter (Calendar) */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start">
                {dateFilter
                  ? formatDate(dateFilter.toISOString())
                  : "Filter by Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilter ?? undefined}
                onSelect={(date) => setDateFilter(date ?? null)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Table */}
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Farmer Name</TableHead>
                <TableHead>Cluster</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Return Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReturns.length > 0 ? (
                filteredReturns.map((item_return) => (
                  <TableRow
                    key={item_return.id}
                    className={getRowClass(item_return.status)}
                  >
                    <TableCell>
                      {item_return?.farmers?.firstname}{" "}
                      {item_return?.farmers?.lastname}
                    </TableCell>
                    <TableCell>{item_return?.clusters?.cluster_name}</TableCell>
                    <TableCell>{item_return?.items?.name}</TableCell>
                    <TableCell>{item_return?.quantity}</TableCell>
                    <TableCell>{formatDate(item_return?.created_at)}</TableCell>
                    <TableCell>{item_return?.reason}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction("returned", item_return)
                            }
                          >
                            Return Item
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction("onhold", item_return)}
                          >
                            Hold
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction("rejected", item_return)
                            }
                            className="text-red-500"
                          >
                            Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No item returns found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemReturnsDialog;
