import { useEffect, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import supabase from "@/db/config";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FiCpu,
  FiTag,
  FiBox,
  FiCheckCircle,
  FiCalendar,
  FiUser,
  FiLoader,
  FiMessageSquare,
  FiCornerUpLeft,
} from "react-icons/fi";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Farmer = {
  id: string;
  firstname: string;
  lastname: string;
};

type Machine = {
  id: string;
  name: string;
  description?: string;
  reference_number: string;
  image?: string;
  type?: string;
  status?: string;
  location?: string;
  acquisition_date?: string;
  is_available: boolean;
};

const BorrowMachine = () => {
  const [scanResult, setScanResult] = useState<string>("");
  const [machine, setMachine] = useState<Machine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<string>("");
  const [dateBorrowed, setDateBorrowed] = useState<string>("");
  const [dateReturn, setDateReturn] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 📷 Scan QR Code
  const handleScan = async (results: any) => {
    if (results && results.length > 0) {
      const value = results[0].rawValue;
      if (lastScanned === value) return;
      setLastScanned(value);
      setTimeout(() => setLastScanned(null), 1000);
      setScanResult(value);
      await fetchMachine(value);
    }
  };

  // 🔍 Fetch machine details
  const fetchMachine = async (reference: string) => {
    setLoading(true);
    setError(null);
    setMachine(null);

    const { data, error } = await supabase
      .from("farming_tools")
      .select("*")
      .eq("reference_number", reference)
      .maybeSingle();

    if (error) {
      console.error("Error fetching machine:", error.message);
      setError("❌ Failed to fetch machine. Try again.");
      setLoading(false);
      return;
    }

    if (!data) {
      setError("🚫 Machine not found!");
      setLoading(false);
      return;
    }

    setMachine(data as Machine);
    setLoading(false);
  };

  // 👩‍🌾 Fetch all farmers for dropdown
  useEffect(() => {
    const fetchFarmers = async () => {
      const { data, error } = await supabase
        .from("farmers")
        .select("id, firstname, lastname");
      if (!error && data) setFarmers(data as Farmer[]);
    };
    fetchFarmers();
  }, []);

  // 📝 Borrow Machine
  const handleBorrow = async () => {
    if (!selectedFarmer || !dateBorrowed || !dateReturn || !machine) return;

    setSubmitting(true);

    const { error: borrowError } = await supabase
      .from("borrow_farming_tools")
      .insert([
        {
          farmer_id: selectedFarmer,
          machinery_id: machine.id,
          date_borrowed: dateBorrowed,
          date_scheduled_returned: dateReturn,
        },
      ]);

    if (borrowError) {
      console.error("Error borrowing machine:", borrowError.message);
      setSubmitting(false);
      alert("❌ Failed to record borrowing.");
      return;
    }

    // Update availability
    const { error: updateError } = await supabase
      .from("farming_tools")
      .update({ is_available: false })
      .eq("id", machine.id);

    if (updateError) {
      console.error("Error updating availability:", updateError.message);
      alert("⚠️ Borrow recorded, but failed to update machine availability.");
    }

    setSubmitting(false);
    setDialogOpen(false);
    alert("✅ Machine successfully borrowed!");
    await fetchMachine(machine.reference_number);
  };

  // 🔁 Return Machine
  const handleReturn = async () => {
    if (!machine) return;
    setSubmitting(true);
    const today = new Date().toISOString().split("T")[0];

    // Find the most recent borrow record
    const { data: borrowRecord, error: fetchError } = await supabase
      .from("borrow_farming_tools")
      .select("id")
      .eq("machinery_id", machine.id)
      .order("date_borrowed", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !borrowRecord) {
      alert("❌ No borrow record found for this machine.");
      setSubmitting(false);
      return;
    }

    // Update borrow record with return details
    const { error: updateBorrowError } = await supabase
      .from("borrow_farming_tools")
      .update({
        remarks: remarks || "Returned successfully",
        date_returned: today,
      })
      .eq("id", borrowRecord.id);

    if (updateBorrowError) {
      console.error("Error updating borrow record:", updateBorrowError.message);
      alert("❌ Failed to update borrow record.");
      setSubmitting(false);
      return;
    }

    // Mark machine as available again
    const { error: updateMachineError } = await supabase
      .from("farming_tools")
      .update({ is_available: true })
      .eq("id", machine.id);

    if (updateMachineError) {
      console.error(
        "Error updating machine availability:",
        updateMachineError.message
      );
      alert("⚠️ Return recorded, but failed to update machine availability.");
    }

    setSubmitting(false);
    setReturnDialogOpen(false);
    setRemarks("");
    alert("✅ Machine successfully returned!");
    await fetchMachine(machine.reference_number);
  };

  return (
    <div className="flex flex-col md:grid md:grid-cols-[350px_1fr] gap-4 p-4 h-full md:h-screen">
      {/* LEFT SIDE — Scanner */}
      <div className="w-full h-full">
        <div className="bg-slate-100 w-full h-[250px] md:h-[300px] rounded overflow-hidden">
          <Scanner
            onScan={handleScan}
            allowMultiple
            onError={(err) => console.error(err)}
            constraints={{ facingMode: "environment" }}
          />
        </div>

        {/* Manual Input */}
        <div className="grid w-full max-w-sm mt-5 gap-3">
          <Input
            type="text"
            value={scanResult}
            onChange={(e) => setScanResult(e.target.value)}
            placeholder="Scan or enter Machine Reference Number"
            onKeyDown={(e) => {
              if (e.key === "Enter" && scanResult) fetchMachine(scanResult);
            }}
          />
          <Button
            onClick={() => fetchMachine(scanResult)}
            disabled={!scanResult}
          >
            Search Machine
          </Button>
        </div>
      </div>

      {/* RIGHT SIDE — Machine Info */}
      <div className="w-full flex flex-col gap-5 shadow-2xl p-4 shadow-[#00000045]">
        {loading ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            ⏳ Fetching machine data...
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-full text-red-500">
            {error}
          </div>
        ) : !machine ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            📷 Scan a machine QR code to view details
          </div>
        ) : (
          <>
            {/* Machine Info */}
            <div className="flex flex-col md:flex-row gap-4">
              {machine.image ? (
                <div className="bg-slate-100 w-full md:w-[250px] h-[200px] rounded overflow-hidden">
                  <img
                    src={machine.image}
                    alt="machine"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="bg-slate-100 w-full md:w-[250px] h-[200px] flex items-center justify-center text-gray-400 rounded">
                  No Image
                </div>
              )}

              <div className="flex-1">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <FiCpu /> {machine.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {machine.description}
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="flex items-center gap-2">
                    <FiTag /> <strong>Reference Number:</strong>{" "}
                    {machine.reference_number}
                  </p>
                  <p className="flex items-center gap-2">
                    <FiBox /> <strong>Type:</strong> {machine.type ?? "N/A"}
                  </p>
                  <p className="flex items-center gap-2">
                    <FiCheckCircle /> <strong>Status:</strong>{" "}
                    <span
                      className={`px-2 py-1 rounded text-white text-xs ${
                        machine.is_available ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    >
                      {machine.is_available ? "Available" : "Borrowed"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Machine Details */}
            <div className="mt-5 border rounded-md p-3">
              <h3 className="font-semibold mb-2">More Details</h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-xs">Condition</TableCell>
                    <TableCell className="text-xs text-right">
                      {machine.status ?? "N/A"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs">Location</TableCell>
                    <TableCell className="text-xs text-right">
                      {machine.location ?? "N/A"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs">Acquisition Date</TableCell>
                    <TableCell className="text-xs text-right">
                      {machine.acquisition_date ?? "N/A"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Return or Borrow */}
            {!machine.is_available ? (
              <>
                <Dialog
                  open={returnDialogOpen}
                  onOpenChange={setReturnDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="mt-5 w-full bg-yellow-600 hover:bg-yellow-700">
                      <FiCornerUpLeft className="mr-2" /> Machine Return
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Return Machine</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                      <Label>
                        <FiMessageSquare className="inline mr-1" /> Remarks
                      </Label>
                      <Input
                        type="text"
                        placeholder="Enter remarks"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button onClick={handleReturn} disabled={submitting}>
                        {submitting && (
                          <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {submitting ? "Processing..." : "Confirm Return"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="mt-5 p-4 bg-yellow-100 text-yellow-800 rounded-md text-center font-medium">
                  {" "}
                  ⚠️ This machine is currently unavailable for borrowing.{" "}
                </div>
              </>
            ) : (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4 w-full md:w-auto">
                    Borrow This Machine
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Borrow Machine</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                      <Label>
                        <FiCalendar className="inline mr-1" /> Date Borrowed
                      </Label>
                      <Input
                        type="date"
                        value={dateBorrowed}
                        onChange={(e) => setDateBorrowed(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>
                        <FiCalendar className="inline mr-1" /> Scheduled Return
                        Date
                      </Label>
                      <Input
                        type="date"
                        value={dateReturn}
                        onChange={(e) => setDateReturn(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>
                        <FiUser className="inline mr-1" /> Select Farmer
                      </Label>
                      <Select onValueChange={setSelectedFarmer}>
                        <SelectTrigger className="w-full">
                          {selectedFarmer
                            ? `${
                                farmers.find((f) => f.id === selectedFarmer)
                                  ?.firstname
                              } ${
                                farmers.find((f) => f.id === selectedFarmer)
                                  ?.lastname
                              }`
                            : "Choose a farmer"}
                        </SelectTrigger>
                        <SelectContent>
                          {farmers.map((farmer) => (
                            <SelectItem key={farmer.id} value={farmer.id}>
                              {farmer.firstname} {farmer.lastname}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleBorrow} disabled={submitting}>
                      {submitting && (
                        <FiLoader className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {submitting ? "Submitting..." : "Confirm Borrow"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BorrowMachine;
