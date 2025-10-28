import { useEffect, useState } from "react";
import supabase from "@/db/config";
import AddItemsDialog from "@/dashboardComponents/AddItemsDialog";
import ItemReturnsDialog from "@/dashboardComponents/ItemReturnsDialog";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CgMoreVertical } from "react-icons/cg";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DeleteItemDialog from "@/dashboardComponents/DeleteItemDialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Inventory() {
  const [items, setItems] = useState<any[]>([]);
  const [itemReturns, setItemReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteItemDialog, setOpenDeleteItemDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [filters, setFilters] = useState({
    type: "",
    search: "",
  });

  // ✅ Fetch data automatically on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, returnsRes] = await Promise.all([
        supabase.from("items").select("*"),
        supabase.from("item_returns").select(`
          id,
          reason,
          quantity,
          created_at,
          status,
          farmers:farmer_id ( firstname, lastname ),
          clusters:cluster_id ( cluster_name ),
          items:item_id ( name,id )
        `),
      ]);

      setItems(itemsRes.data || []);
      setItemReturns(returnsRes.data || []);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
  };

  const filteredItems = items.filter((item) => {
    return (
      (filters.type === "" || item.type === filters.type) &&
      (filters.search === "" ||
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes(filters.search.toLowerCase()))
    );
  });

  const generatePDF = async (id: any) => {
    const { data: item, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !item) {
      console.error("Failed to fetch item:", error);
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const cols = 8;
    const rows = 5;
    const baseCardSize = 35;
    const baseSpacing = 3;
    const baseMargin = 4;
    const cornerRadius = 3;

    const baseWidth =
      baseMargin * 2 + cols * baseCardSize + (cols - 1) * baseSpacing;
    const baseHeight =
      baseMargin * 2 + rows * baseCardSize + (rows - 1) * baseSpacing;

    const scaleX = pageWidth / baseWidth;
    const scaleY = pageHeight / baseHeight;
    const scale = Math.min(scaleX, scaleY);

    const cardSize = baseCardSize * scale;
    const spacing = baseSpacing * scale;
    const margin = baseMargin * scale;

    const qrDataUrl = await QRCode.toDataURL(item.barcode || item.id, {
      width: 256,
      margin: 0,
    });

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = margin + col * (cardSize + spacing);
        const y = margin + row * (cardSize + spacing);

        doc.setDrawColor(160);
        doc.roundedRect(
          x,
          y,
          cardSize,
          cardSize,
          cornerRadius,
          cornerRadius,
          "S"
        );

        const qrPadding = 1 * scale;
        const qrSize = cardSize - qrPadding * 2 - 7 * scale;
        const qrX = x + (cardSize - qrSize) / 2;
        const qrY = y + qrPadding;
        doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

        const itemName = item.name || "Unnamed";
        const textY = qrY + qrSize + 4 * scale;
        const textMaxWidth = cardSize - 4 * scale;

        let fontSize = 7 * scale;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fontSize);
        while (doc.getTextWidth(itemName) > textMaxWidth && fontSize > 3) {
          fontSize -= 0.3;
          doc.setFontSize(fontSize);
        }

        const textX = x + cardSize / 2;
        doc.text(itemName, textX, textY, { align: "center" });
      }
    }

    doc.save(`${item.name || "item"}_qrcards.pdf`);
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("items")
        .update({
          name: editItem.name,
          description: editItem.description,
          type: editItem.type,
          quantity: editItem.quantity,
        })
        .eq("id", editItem.id);

      if (error) throw error;

      toast.success("Item updated successfully!");
      setOpenEditDialog(false);
      fetchData();
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to update item.");
    } finally {
      setSaving(false);
    }
  };

  // 🦴 Skeleton Loader
  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-1 mr-4">
            <div className="h-10 bg-gray-200 rounded w-[200px]" />
            <div className="h-10 bg-gray-200 rounded w-[120px]" />
            <div className="h-10 bg-gray-200 rounded w-[100px]" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-10 bg-gray-200 rounded" />
            <div className="h-10 w-10 bg-gray-200 rounded" />
            <div className="h-10 w-10 bg-gray-200 rounded" />
          </div>
        </div>

        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between border rounded p-2"
            >
              <div className="h-4 bg-gray-200 rounded w-[15%]" />
              <div className="h-4 bg-gray-200 rounded w-[25%]" />
              <div className="h-4 bg-gray-200 rounded w-[20%]" />
              <div className="h-4 bg-gray-200 rounded w-[10%]" />
              <div className="h-4 bg-gray-200 rounded w-[10%]" />
              <div className="h-4 bg-gray-200 rounded w-[8%]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ✅ Actual content
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-1 mr-4">
          <Input
            placeholder="Search..."
            value={filters.search}
            className="w-[200px]"
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />

          <Select
            value={filters.type}
            onValueChange={(val) => handleFilterChange("type", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {[...new Set(items.map((i) => i.type))].map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setFilters({ type: "", search: "" })}
          >
            Reset
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button size="icon" variant="secondary">
            <ItemReturnsDialog item_returns={itemReturns} />
          </Button>

          {/* ✅ Modified Add Item Dialog with toast and refresh */}
          <AddItemsDialog
            onSuccess={() => {
              fetchData();
            }}
          />
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <Table className="min-w-full">
          <TableCaption>Items List</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Barcode</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.barcode}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.quantity}</TableCell>
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
                          setEditItem(item);
                          setOpenEditDialog(true);
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => generatePDF(item.id)}>
                        Print QR Codes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setOpenDeleteItemDialog(true);
                          setDeleteItem(item);
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

        {/* ✏️ Edit Dialog */}
        <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>
            {editItem && (
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editItem.name}
                    onChange={(e) =>
                      setEditItem({ ...editItem, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={editItem.description || ""}
                    onChange={(e) =>
                      setEditItem({ ...editItem, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Input
                    value={editItem.type || ""}
                    onChange={(e) =>
                      setEditItem({ ...editItem, type: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={editItem.quantity || 0}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DeleteItemDialog
          openDeleteItemDialog={openDeleteItemDialog}
          setOpenDeleteItemDialog={setOpenDeleteItemDialog}
          deleteItem={deleteItem}
          onSuccess={() => {
            fetchData();
          }}
        />
      </div>
    </div>
  );
}
