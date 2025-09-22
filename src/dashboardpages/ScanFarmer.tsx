import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Scanner } from "@yudiel/react-qr-scanner";
import { SlLocationPin } from "react-icons/sl";
import { HiOutlineMail } from "react-icons/hi";
import { FiPhone } from "react-icons/fi";
import { HiOutlineUser } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import supabase from "@/db/config";
import { useLoaderData, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { LoaderFunctionArgs } from "react-router-dom";

// Supabase loader for farmer data
export async function loader({ params }: LoaderFunctionArgs) {
  const { farmerId } = params;

  if (!farmerId) {
    return { farmer: null, error: "No farmer ID provided" };
  }

  const { data, error } = await supabase
    .from("farmers")
    .select("*")
    .eq("id_number", farmerId)
    .single();

  if (error) {
    return { farmer: null, error: "Could not fetch farmer" };
  }

  return { farmer: data, error: null };
}

// Type for scanned item
type ScannedItem = {
  id?: string;
  barcode: string;
  name?: string;
  description?: string;
  price?: number;
  picture?: string;
  notFound?: boolean;
  quantity?: number;
};

const ScanFarmer = () => {
  const [scanResult, setScanResult] = useState<string>("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isGoodsDialogOpen, setIsGoodsDialogOpen] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const navigate = useNavigate();

  const loaderData = useLoaderData() as {
    farmer: any | null;
    error: string | null;
  };

  const farmer = loaderData?.farmer;

  // Handle scanned goods inside dialog
  const handleGoodsScan = async (results: any) => {
    if (results && results.length > 0) {
      const value = results[0].rawValue;

      // ✅ Ignore if it's the same code within 1 second
      if (lastScanned === value) return;
      setLastScanned(value);
      setTimeout(() => setLastScanned(null), 1000);

      // Prevent duplicates
      setScannedItems((prev) => {
        if (prev.some((item) => item.barcode === value)) {
          alert(`⚠️ Item with barcode ${value} already scanned!`);
          return prev;
        }
        fetchItem(value);
        return prev;
      });
    }
  };

  // Fetch item details
  // Fetch item details
  const fetchItem = async (barcode: string) => {
    const { data: item, error } = await supabase
      .from("items")
      .select("id, barcode, name, description, price, picture")
      .eq("barcode", barcode)
      .maybeSingle();

    if (error) {
      console.error("Error fetching item:", error.message);
      alert("❌ Error checking item. Please try again.");
      return;
    }

    if (!item) {
      alert(`🚫 Item with barcode ${barcode} not found!`);
      return; // 👈 Do not add to the scannedItems list
    }

    // ✅ Only add if found
    setScannedItems((prev) => [...prev, { ...item, quantity: 1 }]);
  };

  // Save transaction: flat style
  const saveTransaction = async () => {
    if (!farmer) {
      alert("⚠️ No farmer selected!");
      return;
    }

    const validItems = scannedItems.filter((i) => !i.notFound);
    if (validItems.length === 0) {
      alert("⚠️ No valid items to save!");
      return;
    }

    try {
      // 1️⃣ Insert transaction rows
      const rows = validItems.map((i) => ({
        farmer_id: farmer.id,
        item_id: i.id ?? i.barcode,
        quantity: i.quantity ?? 1,
      }));

      const { error: insertError } = await supabase
        .from("transactions")
        .insert(rows);

      if (insertError) throw insertError;

      // 2️⃣ Update stock in items table
      for (const item of validItems) {
        const qty = item.quantity ?? 1;
        const itemId = item.id ?? item.barcode;

        // fetch current stock
        const { data: existingItem, error: fetchError } = await supabase
          .from("items")
          .select("quantity")
          .eq("id", itemId)
          .single();

        if (fetchError) throw fetchError;

        const newQuantity = (existingItem?.quantity ?? 0) - qty;

        // update stock
        const { error: updateError } = await supabase
          .from("items")
          .update({ quantity: newQuantity })
          .eq("id", itemId);

        if (updateError) throw updateError;
      }

      alert("✅ Transaction saved & stock updated!");
      setScannedItems([]);
      setIsGoodsDialogOpen(false);
    } catch (err: any) {
      console.error("Error saving transaction:", err.message);
      alert("❌ Failed to save transaction. Check console.");
    }
  };

  return (
    <div className="grid grid-cols-[350px_1fr] gap-4 p-4 h-screen">
      {/* Left side scanner */}
      <div className="w-full h-full">
        <div className="bg-slate-100 w-full h-[300px] rounded overflow-hidden">
          {!isGoodsDialogOpen && (
            <Scanner
              onScan={(results) => {
                if (results && results.length > 0) {
                  const value = results[0].rawValue;
                  setScanResult(value);
                  navigate(`/dashboard/scanner/${value}`);
                }
              }}
              allowMultiple={true}
              onError={(error) => console.error(error)}
              constraints={{ facingMode: "environment" }}
            />
          )}
        </div>

        {/* Manual Input / Fallback */}
        <div className="grid w-full max-w-sm items-center mt-5 gap-3">
          <Input
            type="text"
            id="farmerId"
            value={scanResult}
            onChange={(e) => setScanResult(e.target.value)}
            className="rounded-sm"
            placeholder="Scan using ID"
            onKeyDown={(e) => {
              if (e.key === "Enter" && scanResult) {
                navigate(`/dashboard/scanner/${scanResult}`);
              }
            }}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="w-full h-full flex flex-col gap-5 shadow-2xl p-4 shadow-[#00000045]">
        {!farmer ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-lg text-center">
            {loaderData?.error
              ? "🚫 User does not exist. Try again!"
              : "📷 Scan QR code to view farmer data"}
          </div>
        ) : (
          <>
            {/* Farmer Profile */}
            <div className="w-full flex gap-4">
              <div className="bg-slate-100 w-[200px] h-[200px] rounded">
                <img
                  src={farmer.profile_picture}
                  className="w-full h-full"
                  alt="profile"
                />
              </div>
              <div>
                <div className="flex flex-col gap-2 mt-2">
                  <span className="flex items-center gap-1 text-sm">
                    <HiOutlineUser /> <strong>Name: </strong>
                    {farmer.firstname} {farmer.lastname}
                  </span>
                  <span className="flex items-center gap-1 text-sm">
                    <SlLocationPin /> <strong>Address: </strong>
                    {farmer.purok}, {farmer.barangay}, {farmer.city},{" "}
                    {farmer.province}
                  </span>
                  <span className="flex items-center gap-1 text-sm">
                    <HiOutlineMail /> <strong>Email: </strong>
                    {farmer.email}
                  </span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiPhone /> <strong>Contact Number: </strong>
                    {farmer.contact_number}
                  </span>

                  {/* Goods Scanner Dialog */}
                  <div>
                    <Dialog
                      open={isGoodsDialogOpen}
                      onOpenChange={setIsGoodsDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button>Scan Goods Collected</Button>
                      </DialogTrigger>
                      <DialogContent className="w-[90vw] h-[80vh] p-4">
                        <DialogHeader>
                          <DialogTitle>Scan Goods</DialogTitle>
                          <DialogDescription>
                            Use the scanner below to record collected goods.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-[300px_1fr] gap-4 h-full">
                          {/* Left: Scanner */}
                          <div className="bg-slate-100 w-[300px] h-[300px] rounded overflow-hidden">
                            <Scanner
                              onScan={handleGoodsScan}
                              allowMultiple={true}
                              onError={(error) => console.error(error)}
                              constraints={{ facingMode: "environment" }}
                            />
                          </div>

                          {/* Right: Scanned Items List */}
                          <div className="border rounded-md p-3 overflow-y-auto">
                            {scannedItems.length === 0 ? (
                              <p className="text-gray-500 text-sm">
                                No items scanned yet.
                              </p>
                            ) : (
                              <ul className="space-y-3">
                                {scannedItems.map((item, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-center gap-3 border-b pb-2 last:border-b-0"
                                  >
                                    {item.notFound ? (
                                      <span className="text-red-500 text-sm">
                                        🚫 Item with barcode{" "}
                                        <strong>{item.barcode}</strong> not
                                        found
                                      </span>
                                    ) : (
                                      <>
                                        {item.picture && (
                                          <img
                                            src={item.picture}
                                            alt={item.name}
                                            className="w-16 h-16 object-cover rounded border"
                                          />
                                        )}
                                        <div className="flex flex-col flex-1">
                                          <span className="font-semibold">
                                            {item.name}
                                          </span>
                                          <span className="text-sm text-gray-600">
                                            {item.description}
                                          </span>
                                          <span className="text-sm font-medium text-green-600">
                                            ₱{item.price}
                                          </span>
                                          <span className="text-xs text-gray-400">
                                            Barcode: {item.barcode}
                                          </span>
                                        </div>

                                        <input
                                          type="number"
                                          min={1}
                                          value={item.quantity || 1}
                                          onChange={(e) => {
                                            const qty =
                                              parseInt(e.target.value) || 1;
                                            setScannedItems((prev) =>
                                              prev.map((p, i) =>
                                                i === idx
                                                  ? { ...p, quantity: qty }
                                                  : p
                                              )
                                            );
                                          }}
                                          className="w-16 border rounded p-1 text-center"
                                        />

                                        <button
                                          onClick={() =>
                                            setScannedItems((prev) =>
                                              prev.filter((_, i) => i !== idx)
                                            )
                                          }
                                          className="ml-2 text-red-500 hover:text-red-700"
                                        >
                                          ❌
                                        </button>
                                      </>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                          </DialogClose>
                          <Button type="button" onClick={saveTransaction}>
                            Save Items
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions placeholder */}
            <div className="flex flex-col gap-2">
              <h2>Previous Transactions</h2>
              <div className="w-full h-[200px] bg-slate-100">
                <Table>
                  <TableCaption>A list of your recent invoices.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">INV001</TableCell>
                      <TableCell>2025-09-21</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button>View</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Invoice Details</DialogTitle>
                              <DialogDescription>
                                Example invoice details here...
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">Close</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ScanFarmer;
