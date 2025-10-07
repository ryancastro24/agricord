import { useState } from "react";
import { useLoaderData } from "react-router-dom";
import supabase from "@/db/config";
import EditFarmerData from "@/dashboardComponents/EditFarmerData";
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
import PrintQRCodes from "@/dashboardComponents/PrintQRCodes";
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

export async function loader() {
  try {
    const [items, item_returns] = await Promise.all([
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

    console.log(item_returns);

    return {
      items: items.data || [],
      item_returns: item_returns.data || [],
      error: items.error || item_returns.error || null,
    };
  } catch (err) {
    console.error("Unexpected error:", err);
    return {
      items: [],
      items_return: [],
      error: "Unexpected error",
    };
  }
}

export default function Inventory() {
  const [openEditFarmerDialog, setOpenEditFarmerDialog] = useState(false);
  const [openDeleteItemDialog, setOpenDeleteItemDialog] = useState(false);
  const [editFarmer, setEditFarmer] = useState(null);
  const [deleteItem, setdeleteItem] = useState(null);
  const { items, item_returns } = useLoaderData() as {
    items: any[];
    item_returns: any[];
    error: string | null;
  };

  const [filters, setFilters] = useState({
    type: "",
    search: "",
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
  };

  // Filter by type + search
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

    // 📄 A4 Landscape
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210mm

    // Base layout (40 cards = 8×5 grid)
    const cols = 8;
    const rows = 5;
    const baseCardSize = 35; // base size before scaling
    const baseSpacing = 3;
    const baseMargin = 4;
    const cornerRadius = 3;

    // Calculate total required width/height for base layout
    const baseWidth =
      baseMargin * 2 + cols * baseCardSize + (cols - 1) * baseSpacing;
    const baseHeight =
      baseMargin * 2 + rows * baseCardSize + (rows - 1) * baseSpacing;

    // 🔍 Compute scaling factor to perfectly fit A4
    const scaleX = pageWidth / baseWidth;
    const scaleY = pageHeight / baseHeight;
    const scale = Math.min(scaleX, scaleY); // preserve aspect ratio

    // Apply scaling
    const cardSize = baseCardSize * scale;
    const spacing = baseSpacing * scale;
    const margin = baseMargin * scale;

    // 🧩 Generate QR code
    const qrDataUrl = await QRCode.toDataURL(item.barcode || item.id, {
      width: 256,
      margin: 0,
    });

    let count = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = margin + col * (cardSize + spacing);
        const y = margin + row * (cardSize + spacing);

        // Card border
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

        // QR Code fills almost the entire card
        const qrPadding = 1 * scale;
        const qrSize = cardSize - qrPadding * 2 - 7 * scale; // space for text
        const qrX = x + (cardSize - qrSize) / 2;
        const qrY = y + qrPadding;
        doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

        // Item name
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

        count++;
      }
    }

    console.log(`✅ Generated ${count} cards (auto-scaled to fit A4)`);
    doc.save(`${item.name || "item"}_qrcards.pdf`);
  };

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
            onClick={() =>
              setFilters({
                type: "",
                search: "",
              })
            }
          >
            Reset
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button size={"icon"} variant={"secondary"}>
            <ItemReturnsDialog item_returns={item_returns} />
          </Button>
          <PrintQRCodes items={items} />
          <AddItemsDialog />
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <Table className="min-w-full ">
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
                          setOpenEditFarmerDialog(true);
                          setEditFarmer(item);
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          generatePDF(item.id);
                        }}
                      >
                        Print QR Codes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setOpenDeleteItemDialog(true);
                          setdeleteItem(item);
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

        <EditFarmerData
          openEditFarmerDialog={openEditFarmerDialog}
          setOpenEditFarmerDialog={setOpenEditFarmerDialog}
          editFarmer={editFarmer}
        />

        <DeleteItemDialog
          openDeleteItemDialog={openDeleteItemDialog}
          setOpenDeleteItemDialog={setOpenDeleteItemDialog}
          deleteItem={deleteItem}
        />
      </div>
    </div>
  );
}
