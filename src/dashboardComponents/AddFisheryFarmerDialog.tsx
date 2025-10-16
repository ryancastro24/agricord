import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LuUserPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import supabase from "@/db/config";
import QRCode from "qrcode";
import Webcam from "react-webcam";
import { toast } from "sonner";

interface AddFisheryFarmerDialogProps {
  onSuccess?: () => void;
}

const AddFisheryFarmerDialog: React.FC<AddFisheryFarmerDialogProps> = ({
  onSuccess,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [newFarmer, setNewFarmer] = useState({
    id: "",
    firstname: "",
    lastname: "",
    purok: "",
    barangay: "",
    city: "",
    province: "",
    contact_number: "",
    qrcode: "",
    id_number: "",
    profile_picture: "",
    created_at: new Date().toISOString(),
  });

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc || null);
    }
  };

  const handleUploads = async (farmerId: string, idNumber: string) => {
    // ✅ Upload profile picture if captured
    if (capturedImage) {
      console.log("📸 Uploading profile picture...");
      const base64 = capturedImage.split(",")[1];
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
      const imgBlob = new Blob([array], { type: "image/png" });

      const filePath = `profile-pictures/farmer-${idNumber}.png`;
      const { error: uploadError } = await supabase.storage
        .from("farmers-bucket")
        .upload(filePath, imgBlob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("farmers-bucket")
        .getPublicUrl(filePath);

      const profilePictureUrl = publicUrlData.publicUrl;

      await supabase
        .from("farmers")
        .update({ profile_picture: profilePictureUrl })
        .eq("id", farmerId);

      console.log("✅ Profile picture uploaded.");
    }

    // ✅ Generate and upload QR code
    console.log("🧾 Generating QR code...");
    const qrContent = idNumber;
    const qrDataUrl = await QRCode.toDataURL(qrContent);

    const base64 = qrDataUrl.split(",")[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    const qrBlob = new Blob([array], { type: "image/png" });

    const qrFilePath = `qrcodes/farmer-${idNumber}.png`;
    const { error: qrUploadError } = await supabase.storage
      .from("farmers-bucket")
      .upload(qrFilePath, qrBlob, { upsert: true });

    if (qrUploadError) throw qrUploadError;

    const { data: qrPublicUrl } = supabase.storage
      .from("farmers-bucket")
      .getPublicUrl(qrFilePath);

    const qrUrl = qrPublicUrl.publicUrl;

    await supabase.from("farmers").update({ qrcode: qrUrl }).eq("id", farmerId);
    console.log("✅ QR code uploaded.");
  };

  const handleAddFarmer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFarmer.firstname || !newFarmer.lastname || !newFarmer.id_number) {
      toast.error("Please complete all required fields.");
      return;
    }

    try {
      setLoading(true);
      console.log("🧾 Adding new farmer:", newFarmer);

      const { id, ...farmerData } = newFarmer;

      const { data: insertedData, error: insertError } = await supabase
        .from("farmers")
        .insert([farmerData])
        .select()
        .single();

      if (insertError) throw insertError;

      console.log("✅ Farmer inserted:", insertedData);

      // Separate upload logic (don’t fail the whole add if upload fails)
      try {
        await handleUploads(insertedData.id, newFarmer.id_number);
      } catch (uploadErr) {
        console.warn("⚠️ Upload failed but farmer saved:", uploadErr);
        toast.warning("Farmer saved but upload failed.");
      }

      toast.success("Farmer successfully added!");
      onSuccess?.();

      // Reset state
      setOpen(false);
      setCapturedImage(null);
      setNewFarmer({
        id: "",
        firstname: "",
        lastname: "",
        purok: "",
        barangay: "",
        city: "",
        province: "",
        contact_number: "",
        qrcode: "",
        id_number: "",
        profile_picture: "",
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("🔥 Add farmer failed:", error);
      toast.error("Failed to add farmer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="flex items-center justify-center">
          <LuUserPlus />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-2xl w-full p-4 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Farmer</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personaldata" className="w-full">
          <TabsList className="w-full flex gap-2 overflow-x-auto">
            <TabsTrigger value="personaldata">Personal</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="photo">Photo</TabsTrigger>
          </TabsList>

          {/* Personal Data */}
          <TabsContent value="personaldata">
            <Card>
              <CardContent className="grid gap-4 py-4">
                <Label>ID Number</Label>
                <Input
                  value={newFarmer.id_number}
                  onChange={(e) =>
                    setNewFarmer({ ...newFarmer, id_number: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Firstname</Label>
                    <Input
                      value={newFarmer.firstname}
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          firstname: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Lastname</Label>
                    <Input
                      value={newFarmer.lastname}
                      onChange={(e) =>
                        setNewFarmer({ ...newFarmer, lastname: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Label>Contact Number</Label>
                <Input
                  type="number"
                  value={newFarmer.contact_number}
                  onChange={(e) =>
                    setNewFarmer({
                      ...newFarmer,
                      contact_number: e.target.value,
                    })
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Address */}
          <TabsContent value="address">
            <Card>
              <CardContent className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Purok</Label>
                    <Input
                      value={newFarmer.purok}
                      onChange={(e) =>
                        setNewFarmer({ ...newFarmer, purok: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Barangay</Label>
                    <Input
                      value={newFarmer.barangay}
                      onChange={(e) =>
                        setNewFarmer({ ...newFarmer, barangay: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={newFarmer.city}
                      onChange={(e) =>
                        setNewFarmer({ ...newFarmer, city: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Province</Label>
                    <Input
                      value={newFarmer.province}
                      onChange={(e) =>
                        setNewFarmer({ ...newFarmer, province: e.target.value })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photo */}
          <TabsContent value="photo">
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-4">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/png"
                  width={320}
                  height={240}
                  videoConstraints={{ facingMode: "user" }}
                  className="rounded-md border"
                />
                <Button variant="outline" onClick={capturePhoto}>
                  Capture
                </Button>
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-40 h-40 object-cover border rounded-md"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            onClick={handleAddFarmer}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFisheryFarmerDialog;
