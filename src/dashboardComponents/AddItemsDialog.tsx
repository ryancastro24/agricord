import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LuPlus } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import supabase from "@/db/config";
import QRCode from "qrcode";
import Webcam from "react-webcam";
import { toast } from "sonner";

const AddItemsDialog = ({ onSuccess }: { onSuccess?: () => void }) => {
  const webcamRef = useRef<Webcam>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    type: "",
    barcode: "",
    quantity: "",
    qrcode: "",
    picture: "",
    created_at: new Date().toISOString(),
  });

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc || null);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItem.barcode) {
      toast.error("Barcode is required.");
      return;
    }

    try {
      setLoading(true);

      // Insert item
      const { id, ...itemData } = newItem;
      const { data: insertedData, error: insertError } = await supabase
        .from("items")
        .insert([itemData])
        .select()
        .single();

      if (insertError) throw insertError;

      const itemId = insertedData.id;

      // ✅ Upload item picture
      let pictureUrl = "";
      if (capturedImage) {
        const base64 = capturedImage.split(",")[1];
        const binary = atob(base64);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
        const imgBlob = new Blob([array], { type: "image/png" });

        const filePath = `items-pictures/item-${newItem.barcode}.png`;

        const { error: uploadError } = await supabase.storage
          .from("items-bucket")
          .upload(filePath, imgBlob, { upsert: true });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from("items-bucket")
            .getPublicUrl(filePath);
          pictureUrl = publicUrlData.publicUrl;

          await supabase
            .from("items")
            .update({ picture: pictureUrl })
            .eq("id", itemId);
        }
      }

      // ✅ Generate and upload QR code
      const qrDataUrl = await QRCode.toDataURL(newItem.barcode);
      const base64 = qrDataUrl.split(",")[1];
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
      const qrBlob = new Blob([array], { type: "image/png" });

      const qrFilePath = `qrcodes/item-${newItem.barcode}.png`;
      const { error: qrUploadError } = await supabase.storage
        .from("items-bucket")
        .upload(qrFilePath, qrBlob, { upsert: true });

      if (!qrUploadError) {
        const { data: qrPublicUrl } = supabase.storage
          .from("items-bucket")
          .getPublicUrl(qrFilePath);
        await supabase
          .from("items")
          .update({ qrcode: qrPublicUrl.publicUrl })
          .eq("id", itemId);
      }

      // ✅ Success actions
      toast.success("Item added successfully!");
      setOpen(false);
      setCapturedImage(null);
      setNewItem({
        id: "",
        name: "",
        description: "",
        price: "",
        type: "",
        barcode: "",
        quantity: "",
        qrcode: "",
        picture: "",
        created_at: new Date().toISOString(),
      });

      onSuccess?.(); // refresh parent data
    } catch (err: any) {
      console.error("Error adding item:", err);
      toast.error("Failed to add item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="icon" className="flex items-center gap-2">
            <LuPlus />
          </Button>
        </DialogTrigger>

        <DialogContent className="w-[600px] p-4">
          <Tabs defaultValue="details">
            <TabsList className="w-full flex gap-5">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="photo">Photo</TabsTrigger>
            </TabsList>

            {/* 🧾 Item Details */}
            <TabsContent value="details">
              <Card>
                <CardContent className="grid gap-6 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-3">
                      <Label>Item Name</Label>
                      <Input
                        value={newItem.name}
                        onChange={(e) =>
                          setNewItem({ ...newItem, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid gap-3">
                      <Label>Barcode</Label>
                      <Input
                        value={newItem.barcode}
                        onChange={(e) =>
                          setNewItem({ ...newItem, barcode: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <Label>Description</Label>
                    <Input
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-3">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) =>
                          setNewItem({ ...newItem, quantity: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label>Type</Label>
                      <Input
                        value={newItem.type}
                        onChange={(e) =>
                          setNewItem({ ...newItem, type: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 📸 Photo Capture */}
            <TabsContent value="photo">
  <Card>
    <CardContent className="flex flex-col items-center gap-4 pt-4">
      {capturedImage ? (
        <>
          {/* Show captured image */}
          <img
            src={capturedImage}
            alt="Captured"
            className="w-80 h-60 object-cover rounded-lg border shadow-md"
          />
          <Button
            variant="outline"
            onClick={() => setCapturedImage(null)}
            className="mt-2"
          >
            Retake
          </Button>
        </>
      ) : (
        <>
          {/* Show live webcam */}
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/png"
            width={320}
            height={240}
            className="rounded-lg border shadow-md"
          />
          <Button onClick={capturePhoto} className="mt-2">
            Capture
          </Button>
        </>
      )}
    </CardContent>
  </Card>
</TabsContent>

          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              onClick={handleAddItem}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddItemsDialog;
