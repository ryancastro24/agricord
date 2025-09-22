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

const AddItemsDialog = () => {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    type: "",
    barcode: "", // <-- now user input
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
      alert("Barcode is required.");
      return;
    }

    const { id, ...itemData } = newItem;
    const itemToInsert = { ...itemData };

    // Insert item
    const { data: insertedData, error: insertError } = await supabase
      .from("items")
      .insert([itemToInsert])
      .select()
      .single();

    if (insertError) {
      console.error("Error adding item:", insertError);
      return;
    }

    const itemId = insertedData.id;

    // ✅ Upload item picture
    let pictureUrl = "";
    if (capturedImage) {
      const base64 = capturedImage.split(",")[1];
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
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

    // ✅ Generate QR Code (based on barcode)
    const qrContent = newItem.barcode;
    const qrDataUrl = await QRCode.toDataURL(qrContent);

    const base64 = qrDataUrl.split(",")[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    const qrBlob = new Blob([array], { type: "image/png" });

    const filePath = `qrcodes/item-${newItem.barcode}.png`;
    const { error: qrUploadError } = await supabase.storage
      .from("items-bucket")
      .upload(filePath, qrBlob, { upsert: true });

    if (!qrUploadError) {
      const { data: publicUrlData } = supabase.storage
        .from("items-bucket")
        .getPublicUrl(filePath);
      const qrUrl = publicUrlData.publicUrl;

      await supabase.from("items").update({ qrcode: qrUrl }).eq("id", itemId);
    }

    console.log("✅ Item added with QR + picture:", {
      ...insertedData,
      barcode: newItem.barcode,
      picture: pictureUrl,
    });
  };

  return (
    <div>
      <Dialog>
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

            {/* Item Details */}
            <TabsContent value="details">
              <Card>
                <CardContent className="grid gap-6">
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
                    <Label>Description</Label>
                    <Input
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem({ ...newItem, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-3">
                      <Label>Price</Label>
                      <Input
                        type="number"
                        value={newItem.price}
                        onChange={(e) =>
                          setNewItem({ ...newItem, price: e.target.value })
                        }
                      />
                    </div>
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
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-3">
                      <Label>Type</Label>
                      <Input
                        value={newItem.type}
                        onChange={(e) =>
                          setNewItem({ ...newItem, type: e.target.value })
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Photo */}
            <TabsContent value="photo">
              <Card>
                <CardContent className="flex flex-col items-center gap-4">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/png"
                    width={320}
                    height={240}
                  />
                  <Button onClick={capturePhoto}>Capture</Button>
                  {capturedImage && (
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-40 h-40 object-cover border"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" onClick={handleAddItem}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddItemsDialog;
