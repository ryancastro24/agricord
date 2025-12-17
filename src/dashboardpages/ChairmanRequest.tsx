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
  quantity?: number;
}

interface ItemRequest {
  id: number;
  created_at: string;
  user_id: string;
  requested_items: Item[];
  is_approved: string | null;
}

/* ---------------- COMPONENT ---------------- */
const ChairmanRequest = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [filterDate, setFilterDate] = useState<string>("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    fetchItems();
    fetchRequests();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("items")
      .select("id, name, description, type, quantity");

    if (!error && data) setItems(data as Item[]);
  };

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("item_requests")
      .select("id, created_at, requested_items, is_approved, user_id")
      .order("created_at", { ascending: false });

    if (!error && data) setRequests(data as ItemRequest[]);
  };

  /* ---------------- ITEM HANDLERS ---------------- */
  const addItem = () => {
    if (!selectedItem) return;
    if (selectedItems.some((i) => i.id === selectedItem.id)) return;
    setSelectedItems((prev) => [...prev, { ...selectedItem, quantity: 1 }]);
    setSelectedItem(null);
  };

  const removeItem = (id: number) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: number, qty: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const safeQty = Math.min(Math.max(qty, 1), item.quantity ?? 1);
    setSelectedItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: safeQty } : i))
    );
  };

  /* ---------------- SUBMIT ---------------- */
  const resetDialog = () => {
    setSelectedItems([]);
    setSelectedItem(null);
    setEditingRequestId(null);
    setOpen(false);
  };

  const submitRequest = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || selectedItems.length === 0) return;

    for (const item of selectedItems) {
      const inventoryItem = items.find((i) => i.id === item.id);
      if (
        !inventoryItem ||
        (inventoryItem.quantity ?? 0) < (item.quantity ?? 1)
      ) {
        alert(`Not enough stock for ${item.name}`);
        return;
      }
    }

    if (editingRequestId) {
      const { error } = await supabase
        .from("item_requests")
        .update({ requested_items: selectedItems })
        .eq("id", editingRequestId)
        .eq("is_approved", "pending");

      if (!error) {
        resetDialog();
        fetchRequests();
      }
    } else {
      const { error } = await supabase.from("item_requests").insert({
        user_id: user.id,
        requested_items: selectedItems,
      });

      if (!error) {
        resetDialog();
        fetchRequests();
      }
    }
  };

  /* ---------------- CANCEL ---------------- */
  const cancelRequest = async (id: number) => {
    const { error } = await supabase
      .from("item_requests")
      .delete()
      .eq("id", id);

    if (!error) fetchRequests();
  };

  /* ---------------- STATUS ---------------- */
  const getStatusBadge = (status: string | null) => {
    if (status === "pending") return <Badge variant="secondary">Pending</Badge>;
    if (status === "approved")
      return <Badge className="bg-green-600">Approved</Badge>;
    return <Badge variant="destructive">Rejected</Badge>;
  };

  /* ---------------- FILTERED REQUESTS ---------------- */
  const filteredRequests = requests.filter((r) => {
    if (!filterDate) return true;
    const requestDate = new Date(r.created_at).toISOString().split("T")[0];
    return requestDate === filterDate;
  });

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-xl">Item Requests</CardTitle>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <Button onClick={() => setOpen(true)}>Request Items</Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[300px] border-collapse border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Date</th>
                <th className="border p-2 text-left">Items</th>
                <th className="hidden sm:table-cell border p-2 text-left">
                  Status
                </th>
                <th className="hidden sm:table-cell border p-2 text-left">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr key={req.id} className="border-b">
                  <td className="border p-2 break-words">
                    {new Date(req.created_at).toLocaleString()}
                  </td>
                  <td className="border p-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExpandedRow(expandedRow === req.id ? null : req.id)
                      }
                    >
                      {expandedRow === req.id
                        ? "Hide Items"
                        : `View Items (${req.requested_items.length})`}
                    </Button>
                    {expandedRow === req.id && (
                      <div className="mt-2 space-y-1">
                        {req.requested_items.map((i) => (
                          <div
                            key={i.id}
                            className="flex justify-between border rounded p-2 text-sm"
                          >
                            <span>{i.name}</span>
                            <span className="font-semibold">
                              Qty: {i.quantity ?? 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="hidden sm:table-cell border p-2">
                    {getStatusBadge(req.is_approved)}
                  </td>
                  <td className="hidden sm:table-cell border p-2">
                    {req.is_approved === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedItems(req.requested_items);
                            setEditingRequestId(req.id);
                            setOpen(true);
                          }}
                        >
                          Edit
                        </Button>

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
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Back</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive"
                                onClick={() => cancelRequest(req.id)}
                              >
                                Yes, Cancel
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </td>

                  {/* Mobile "More" Button */}
                  <td className="sm:hidden border p-2">
                    <div className="flex flex-col gap-1">
                      <span>{getStatusBadge(req.is_approved)}</span>
                      {req.is_approved === "pending" && (
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedItems(req.requested_items);
                              setEditingRequestId(req.id);
                              setOpen(true);
                            }}
                          >
                            Edit
                          </Button>
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
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Back</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive"
                                  onClick={() => cancelRequest(req.id)}
                                >
                                  Yes, Cancel
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                    {item.name} (Stock: {item.quantity ?? 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={addItem}>
              Add Item
            </Button>

            <div className="space-y-2">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center border rounded p-2 gap-2"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Available:{" "}
                      {items.find((i) => i.id === item.id)?.quantity ?? 0}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity ?? 1}
                      onChange={(e) =>
                        updateQuantity(item.id, Number(e.target.value))
                      }
                      className="w-16 border rounded px-2 py-1 text-center"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
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
