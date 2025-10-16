import React, { useEffect, useState, useRef } from "react";
import supabase from "@/db/config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import Webcam from "react-webcam";
import QRCode from "qrcode";
import { toast } from "sonner";

interface Machine {
  id: string;
  reference_number: string;
  status: string;
  color: string;
  type: string;
  is_available: boolean;
  image?: string;
  qr_code?: string;
}

const MachineryInventory: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [referenceNumber, setReferenceNumber] = useState("");
  const [status, setStatus] = useState("okay");
  const [color, setColor] = useState("");
  const [type, setType] = useState("");

  const [imageData, setImageData] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  // 🧩 Auto-load machines
  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    setFetching(true);
    const { data, error } = await supabase.from("farming_tools").select("*");
    if (error) {
      console.error(error);
      toast.error("Failed to fetch machines.");
    } else {
      setMachines(data as Machine[]);
    }
    setFetching(false);
  };

  const filteredMachines = machines.filter((m) => {
    const matchesSearch = m.reference_number
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesType = filterType ? m.type === filterType : true;
    const matchesAvailability = filterAvailability
      ? filterAvailability === "available"
        ? m.is_available === true
        : m.is_available === false
      : true;
    return matchesSearch && matchesType && matchesAvailability;
  });

  const captureImage = () => {
    if (webcamRef.current) {
      const img = webcamRef.current.getScreenshot();
      setImageData(img || null);
    }
  };

  // 🔼 Upload base64 image to Supabase storage
  const uploadImage = async (path: string, base64Img: string) => {
    const base64 = base64Img.split(",")[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    const blob = new Blob([array], { type: "image/png" });

    const { error } = await supabase.storage
      .from("machine_buckets")
      .upload(path, blob, { upsert: true });
    if (error) throw error;

    const { data } = supabase.storage
      .from("machine_buckets")
      .getPublicUrl(path);
    return data.publicUrl;
  };

  // 🔼 Generate and Upload QR code
  const uploadQRCode = async (reference: string) => {
    const qrDataUrl = await QRCode.toDataURL(reference);
    return await uploadImage(`qrcode/machine-${reference}.png`, qrDataUrl);
  };

  // 💾 Add new machine
  const handleAddMachine = async () => {
    if (!referenceNumber || !color || !type) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      const { data: inserted, error } = await supabase
        .from("farming_tools")
        .insert([
          {
            reference_number: referenceNumber,
            status,
            color,
            type,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      try {
        // Upload photo if available
        if (imageData) {
          const imageUrl = await uploadImage(
            `tools-image/${referenceNumber}.png`,
            imageData
          );
          await supabase
            .from("farming_tools")
            .update({ image: imageUrl })
            .eq("id", inserted.id);
        }

        // Upload QR code and store URL to farming_tools.qrcode
        const qrUrl = await uploadQRCode(referenceNumber);
        await supabase
          .from("farming_tools")
          .update({ qr_code: qrUrl })
          .eq("id", inserted.id);

        toast.success("✅ Machine added successfully!");
        setOpenDialog(false);
        fetchMachines();
        resetForm();
      } catch (uploadErr) {
        console.warn("⚠️ Upload issue:", uploadErr);
        toast.warning("Machine added, but image or QR upload failed.");
      }
    } catch (err) {
      console.error("🔥 Add machine failed:", err);
      toast.error("Failed to add machine.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this machine?")) return;

    try {
      setDeletingId(id);
      const { error } = await supabase
        .from("farming_tools")
        .delete()
        .eq("id", id);
      if (error) throw error;

      toast.success("Machine deleted successfully!");
      fetchMachines();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete machine.");
    } finally {
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setReferenceNumber("");
    setStatus("okay");
    setColor("");
    setType("");
    setImageData(null);
  };

  const clearFilters = () => {
    setSearch("");
    setFilterType("");
    setFilterAvailability("");
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Machinery Inventory</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Search machine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tractor">Tractor</SelectItem>
              <SelectItem value="dryer">Dryer</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterAvailability}
            onValueChange={setFilterAvailability}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>

          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="ml-auto flex items-center gap-2">
                <LuPlus /> Add Machine
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Machine</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-5">
                <div className="w-full flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Reference Number</Label>
                    <Input
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Color</Label>
                    <Input
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tractor">Tractor</SelectItem>
                        <SelectItem value="dryer">Dryer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="okay">Okay</SelectItem>
                        <SelectItem value="under maintenance">
                          Under Maintenance
                        </SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  {/* 📸 Machine Photo */}
                  <div className="space-y-2">
                    <Label>Machine Photo</Label>
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/png"
                      width={320}
                      height={240}
                      className="rounded-md border"
                    />
                    <Button
                      variant="secondary"
                      className="w-full cursor-pointer"
                      onClick={captureImage}
                    >
                      Capture Image
                    </Button>

                    {imageData && (
                      <img
                        src={imageData}
                        alt="Machine Preview"
                        className="w-40 h-40 border rounded-md object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button onClick={handleAddMachine} disabled={loading}>
                  {loading ? "Saving..." : "Save Machine"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* 🔄 Skeleton Loader */}
      {fetching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-20" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMachines.map((m) => (
            <Card
              className={`${!m.is_available ? "bg-red-500 text-white" : ""}`}
              key={m.id}
            >
              <CardHeader>
                {m.image && (
                  <img
                    src={m.image}
                    alt="Machine"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <h2 className="text-sm">
                    <strong>RN:</strong> {m.reference_number}
                  </h2>
                  <div className="flex items-center justify-between text-xs">
                    <span>Type: {m.type}</span>
                    <span>Color: {m.color}</span>
                  </div>
                  <span className="text-xs">Status: {m.status}</span>
                </div>

                <div className="flex gap-2 justify-between items-center mt-3">
                  {m.qr_code && (
                    <img
                      src={m.qr_code}
                      alt="Machine"
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(m.id)}
                    disabled={deletingId === m.id}
                  >
                    {deletingId === m.id ? (
                      "Deleting..."
                    ) : (
                      <>
                        <LuTrash2 className="mr-1" /> Remove
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MachineryInventory;
