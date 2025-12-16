import { useEffect, useState } from "react";
import supabase from "@/db/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

/* ---------------- TYPES ---------------- */

interface Item {
  id: number;
  name: string;
  description?: string;
  type?: string;
}

interface ItemRequest {
  id: number;
  created_at: string;
  user_id: string;
  requested_items: Item[];
  is_approved: string | null;
  users: {
    firstname: string;
    lastname: string;
  };
}

/* ---------------- COMPONENT ---------------- */

const ChairmanRequest = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [open, setOpen] = useState<boolean>(false);
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [filter, setFilter] = useState<string>("all");

  /* ---------------- FETCH ---------------- */

  console.log("requests", requests);

  useEffect(() => {
    fetchItems();
    fetchRequests();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("items")
      .select("id, name, description, type");

    if (!error && data) setItems(data as Item[]);
  };

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("item_requests")
      .select(
        `
      id,
      created_at,
      requested_items,
      is_approved,
      user_id,
      users (
        id,
        firstname, 
        lastname
      )
    `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setRequests(data as any);
  };

  /* ---------------- ITEM PILLS ---------------- */

  const addItem = () => {
    if (!selectedItem) return;
    if (selectedItems.some((i) => i.id === selectedItem.id)) return;

    setSelectedItems((prev) => [...prev, selectedItem]);
    setSelectedItem(null);
  };

  const removeItem = (id: number) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== id));
  };

  /* ---------------- SUBMIT ---------------- */

  const submitRequest = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || selectedItems.length === 0) return;

    const { error } = await supabase.from("item_requests").insert({
      user_id: user.id,
      requested_items: selectedItems,
    });

    if (!error) {
      setSelectedItems([]);
      setOpen(false);
      fetchRequests();
    }
  };

  /* ---------------- CANCEL ---------------- */

  const cancelRequest = async (id: number) => {
    const { error } = await supabase
      .from("item_requests")
      .delete()
      .eq("id", id);

    if (!error) {
      fetchRequests();
    }
  };

  /* ---------------- STATUS ---------------- */

  const getStatusBadge = (status: string | null) => {
    if (status === "pending") return <Badge variant="secondary">Pending</Badge>;
    if (status === "approved")
      return <Badge className="bg-green-600">Approved</Badge>;
    return <Badge variant="destructive">Rejected</Badge>;
  };

  /* ---------------- FILTER ---------------- */

  const filteredRequests = requests.filter((r) =>
    filter === "all" ? true : r.user_id === filter
  );

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Item Requests</CardTitle>
        <Button onClick={() => setOpen(true)}>Request Items</Button>
      </CardHeader>

      <CardContent>
        {/* FILTER */}
        <div className="mb-4 max-w-xs">
          <Select onValueChange={setFilter} defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {[...new Set(requests.map((r) => r.user_id))].map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* TABLE */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date Requested</TableHead>

              <TableHead>Requested Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>
                  {new Date(req.created_at).toLocaleString()}
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {req.requested_items?.map((i) => (
                      <Badge key={i.id} variant="secondary">
                        {i.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>

                <TableCell>{getStatusBadge(req.is_approved)}</TableCell>

                <TableCell>
                  {req.is_approved === "pending" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Cancel
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Cancel this request?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The item request will
                            be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>Back</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => cancelRequest(req.id)}
                          >
                            Yes, Cancel Request
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Items</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Select
              value={selectedItem?.id?.toString()}
              onValueChange={(val) =>
                setSelectedItem(
                  items.find((i) => i.id.toString() === val) || null
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={addItem}>
              Add Item
            </Button>

            <div className="flex flex-wrap gap-2">
              {selectedItems.map((item) => (
                <Badge
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => removeItem(item.id)}
                >
                  {item.name} ✕
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={submitRequest} disabled={!selectedItems.length}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ChairmanRequest;
