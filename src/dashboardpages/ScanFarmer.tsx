import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Scanner } from "@yudiel/react-qr-scanner";
import { SlLocationPin } from "react-icons/sl";
import { HiOutlineUser } from "react-icons/hi";
import { FiPhone } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { LuCake } from "react-icons/lu";
import supabase from "@/db/config";
import { useLoaderData, useNavigate } from "react-router-dom";
import { Table, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { BsGenderTrans } from "react-icons/bs";
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
// import {
//   Table,
//   TableBody,
//   TableCaption,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
import { RiDeleteBinFill } from "react-icons/ri";
import type { LoaderFunctionArgs } from "react-router-dom";

// 🧠 Types
type Farmer = {
  id: string;
  id_number: string;
  firstname: string;
  lastname: string;
  email: string;
  profile_picture?: string;
  contact_number?: string;
  purok?: string;
  barangay?: string;
  city?: string;
  province?: string;
  sex?: string;
  date_of_birth?: string;
  civil_status?: string;
  religion?: string;
  highest_formal_education?: string;
  is_with_disability?: boolean;
  is_4ps_beneficiary?: boolean;
  cooperative?: string;
  person_to_notify_emergency?: string;
  person_to_notify_emergency_contact_number?: string;
};

type ScannedItem = {
  id: string;
  barcode: string;
  name?: string;
  description?: string;
  price?: number;
  picture?: string;
  notFound?: boolean;
  quantity?: number;
};

// 🧾 Loader — fetch farmer by ID
export async function loader({ params }: LoaderFunctionArgs) {
  const { farmerId } = params;

  console.log("Farmer ID from params:", farmerId);

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

  // ✅ Check if farmer already scanned today
  if (data) {
    const today = new Date().toISOString().split("T")[0];

    const { data: attendance, error: attErr } = await supabase
      .from("attendance")
      .select("id, created_at")
      .eq("farmer_id", data.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!attErr && attendance && attendance.length > 0) {
      const lastScanDate = new Date(attendance[0].created_at)
        .toISOString()
        .split("T")[0];
      if (lastScanDate === today) {
        return {
          farmer: null,
          alreadyScanned: true,
          error: null,
        };
      }
    }
  }

  return { farmer: data, alreadyScanned: false, error: null };
}

const ScanFarmer = () => {
  const [scanResult, setScanResult] = useState<string>("");
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isGoodsDialogOpen, setIsGoodsDialogOpen] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const navigate = useNavigate();

  const loaderData = useLoaderData() as {
    farmer: Farmer | null;
    alreadyScanned?: boolean;
    error: string | null;
  };

  const farmer = loaderData?.farmer;

  // 🔍 Scan goods QR codes
  const handleGoodsScan = async (results: any) => {
    if (results && results.length > 0) {
      const value = results[0].rawValue;

      // Prevent duplicate scan in 1 second
      if (lastScanned === value) return;
      setLastScanned(value);
      setTimeout(() => setLastScanned(null), 1000);

      // Prevent duplicates
      if (scannedItems.some((item) => item.barcode === value)) {
        alert(`⚠️ Item with barcode ${value} already scanned!`);
        return;
      }

      await fetchItem(value);
    }
  };

  // 🔎 Fetch item by barcode
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
      return;
    }

    setScannedItems((prev) => [...prev, { ...item, quantity: 1 }]);
  };

  // 💾 Save transactions
  // 💾 Save transactions + deduct inventory
  const saveTransaction = async () => {
    if (!farmer) {
      alert("⚠️ No farmer selected!");
      return;
    }

    if (scannedItems.length === 0) {
      alert("⚠️ Please scan at least one item!");
      return;
    }

    try {
      // 1️⃣ Get logged-in user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        alert("⚠️ Failed to identify logged-in user!");
        console.error("User fetch error:", userError);
        return;
      }
      const staff_id = userData.user.id;

      // 2️⃣ Get farmer’s cluster
      const { data: farmerCluster, error: clusterError } = await supabase
        .from("farmer_clusters")
        .select("cluster_id")
        .eq("farmer_id", farmer.id)
        .single();

      if (clusterError) throw clusterError;
      if (!farmerCluster) {
        alert("⚠️ Farmer is not linked to any cluster!");
        return;
      }

      const cluster_id = farmerCluster.cluster_id;

      // 3️⃣ Prepare transactions
      const transactions = scannedItems.map((item) => ({
        farmer_id: farmer.id,
        staff_id,
        item_id: item.id,
        quantity: item.quantity ?? 1,
      }));

      // 4️⃣ Save to transactions table
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert(transactions);
      if (transactionError) throw transactionError;

      // 5️⃣ Deduct item quantities from inventory
      for (const item of scannedItems) {
        const quantityToDeduct = item.quantity ?? 1;

        // 🔹 Get current item quantity
        const { data: currentItem, error: fetchError } = await supabase
          .from("items")
          .select("quantity")
          .eq("id", item.id)
          .single();

        if (fetchError || !currentItem) {
          console.error(`❌ Error fetching item ${item.name}`, fetchError);
          continue; // skip to next item
        }

        const newQuantity = Math.max(
          (currentItem.quantity ?? 0) - quantityToDeduct,
          0
        );

        // 🔹 Update item quantity
        const { error: updateError } = await supabase
          .from("items")
          .update({ quantity: newQuantity })
          .eq("id", item.id);

        if (updateError) {
          console.error(
            `❌ Error updating quantity for ${item.name}`,
            updateError
          );
        }
      }

      // 6️⃣ Record attendance
      const { error: attendanceError } = await supabase
        .from("attendance")
        .insert([
          {
            farmer_id: farmer.id,
            cluster_id,
          },
        ]);
      if (attendanceError) throw attendanceError;

      alert("✅ Transactions saved and inventory updated successfully!");
      setScannedItems([]);
      setIsGoodsDialogOpen(false);
    } catch (err: any) {
      console.error("❌ Error saving transactions:", err.message);
      alert("❌ Failed to save transactions. Check console for details.");
    }
  };

  return (
    <div className="flex flex-col md:grid md:grid-cols-[350px_1fr] gap-4 p-4 h-full md:h-screen">
      {/* LEFT SIDE SCANNER */}
      <div className="w-full h-full">
        <div className="bg-slate-100 w-full h-[250px] md:h-[300px] rounded overflow-hidden">
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

        {/* Manual Input */}
        <div className="grid w-full max-w-sm mt-5 gap-3">
          <Input
            type="text"
            value={scanResult}
            onChange={(e) => setScanResult(e.target.value)}
            className="rounded-sm"
            placeholder="Scan or enter Farmer ID"
            onKeyDown={(e) => {
              if (e.key === "Enter" && scanResult) {
                navigate(`/dashboard/scanner/${scanResult}`);
              }
            }}
          />
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full flex flex-col gap-5 shadow-2xl p-4 shadow-[#00000045]">
        {loaderData?.alreadyScanned ? (
          <div className="flex items-center justify-center h-[200px] md:h-full text-green-600 font-semibold text-lg text-center">
            ✅ Farmer already scanned today!
          </div>
        ) : !farmer ? (
          <div className="flex items-center justify-center h-[200px] md:h-full text-gray-500 text-lg text-center">
            {loaderData?.error
              ? "🚫 User does not exist. Try again!"
              : "📷 Scan QR code to view farmer data"}
          </div>
        ) : (
          <>
            {/* Farmer Profile */}
            <div className="w-full flex flex-col  gap-4">
              <div className="md:flex-row flex flex-col gap-4">
                <div className="bg-slate-100 md:flex-row w-full md:w-[200px] h-[200px] rounded">
                  <img
                    src={farmer.profile_picture}
                    className="w-full h-full object-cover rounded"
                    alt="profile"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col gap-2 mt-2 text-sm">
                    <span className="flex items-center gap-1">
                      <HiOutlineUser /> <strong>Name:</strong>{" "}
                      {farmer.firstname} {farmer.lastname}
                    </span>
                    <span className="flex items-center gap-1">
                      <SlLocationPin /> <strong>Address:</strong> {farmer.purok}
                      , {farmer.barangay}, {farmer.city}, {farmer.province}
                    </span>
                    <span className="flex items-center gap-1">
                      <BsGenderTrans /> <strong>Sex:</strong> {farmer.sex}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiPhone /> <strong>Contact:</strong>{" "}
                      {farmer.contact_number}
                    </span>

                    <span className="flex items-center gap-1">
                      <LuCake /> <strong>Birthdate:</strong>{" "}
                      {farmer.date_of_birth}
                    </span>

                    {/* GOODS SCAN DIALOG */}
                    <div className="mt-3">
                      <Dialog
                        open={isGoodsDialogOpen}
                        onOpenChange={setIsGoodsDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button className="w-full md:w-auto">
                            Scan Goods Collected
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-full md:w-[90vw] rounded-none md:rounded p-4">
                          <DialogHeader>
                            <DialogTitle>Scan Goods</DialogTitle>
                            <DialogDescription>
                              Use the scanner below to record collected goods.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="flex flex-col md:grid md:grid-cols-[300px_1fr] gap-4 h-full">
                            {/* Left: Scanner */}
                            <div className="bg-slate-100 w-full h-[250px] md:h-[300px] rounded overflow-hidden">
                              <Scanner
                                onScan={handleGoodsScan}
                                allowMultiple={true}
                                onError={(error) => console.error(error)}
                                constraints={{ facingMode: "environment" }}
                              />
                            </div>

                            {/* Right: Scanned Items */}
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
                                      className="flex flex-col justify-between gap-3 border-b pb-2 last:border-b-0"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          {item.picture && (
                                            <img
                                              src={item.picture}
                                              alt={item.name}
                                              className="w-18 h-18 object-cover rounded border"
                                            />
                                          )}
                                          <div className="flex flex-col flex-1">
                                            <span className="font-semibold">
                                              {item.name}
                                            </span>
                                            <span className="text-xs text-gray-600">
                                              {item.description}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                              Barcode: {item.barcode}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-2">
                                          <input
                                            type="number"
                                            value={item.quantity ?? ""}
                                            onChange={(e) => {
                                              const qty =
                                                e.target.value === ""
                                                  ? undefined
                                                  : parseInt(
                                                      e.target.value,
                                                      10
                                                    );
                                              setScannedItems((prev) =>
                                                prev.map((p, i) =>
                                                  i === idx
                                                    ? { ...p, quantity: qty }
                                                    : p
                                                )
                                              );
                                            }}
                                            className="w-10 border rounded p-1 text-center"
                                          />

                                          <Button
                                            onClick={() =>
                                              setScannedItems((prev) =>
                                                prev.filter((_, i) => i !== idx)
                                              )
                                            }
                                            variant="destructive"
                                            size="icon"
                                            className="rounded-sm"
                                          >
                                            <RiDeleteBinFill />
                                          </Button>
                                        </div>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>

                          <DialogFooter>
                            <DialogClose asChild>
                              <Button
                                variant="outline"
                                className="w-full md:w-auto"
                              >
                                Close
                              </Button>
                            </DialogClose>
                            <Button
                              type="button"
                              onClick={saveTransaction}
                              className="w-full md:w-auto"
                            >
                              Save Items
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2>More Details</h2>

                <div className="w-full h-24 p-2 rounded-md">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-xs">Status</TableCell>
                        <TableCell className="text-xs text-right">
                          {farmer.civil_status}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Religion</TableCell>
                        <TableCell className="text-xs text-right">
                          {farmer.religion}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell className="text-xs">
                          Highest Educational Attainment
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {farmer.highest_formal_education}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">
                          With Disability
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {farmer.is_with_disability ? "Yes" : "No"}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell className="text-xs">4Ps Member</TableCell>
                        <TableCell className="text-xs text-right">
                          {farmer.is_4ps_beneficiary ? "Yes" : "No"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">Cooperative</TableCell>
                        <TableCell className="text-xs text-right">
                          {farmer.cooperative}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell className="text-xs">
                          Contact Person
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {farmer.person_to_notify_emergency}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-xs">
                          Contact Person Number
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {farmer.person_to_notify_emergency_contact_number}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ScanFarmer;
