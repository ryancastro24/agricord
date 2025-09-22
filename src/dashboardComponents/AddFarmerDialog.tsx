import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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

const AddFarmerDialog = () => {
  const webcamRef = useRef<Webcam>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [newFarmer, setNewFarmer] = useState({
    id: "",
    firstname: "",
    lastname: "",
    purok: "",
    barangay: "",
    city: "",
    province: "",
    email: "",
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

  const handleAddFarmer = async (e: React.FormEvent) => {
    e.preventDefault();

    const year = new Date().getFullYear();

    const { data: lastFarmer } = await supabase
      .from("farmers")
      .select("id_number")
      .like("id_number", `FRM-${year}-%`)
      .order("id_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    let newSequence = 1;
    if (lastFarmer && lastFarmer.id_number) {
      const lastSeq = parseInt(lastFarmer.id_number.split("-")[2], 10);
      newSequence = lastSeq + 1;
    }

    const newIdNumber = `FRM-${year}-${String(newSequence).padStart(4, "0")}`;

    const { id, ...farmerData } = newFarmer;

    const farmerToInsert = { ...farmerData, id_number: newIdNumber };

    const { data: insertedData, error: insertError } = await supabase
      .from("farmers")
      .insert([farmerToInsert])
      .select()
      .single();

    if (insertError) {
      console.error("Error adding farmer:", insertError);
      return;
    }

    const farmerId = insertedData.id;

    // ✅ Upload profile picture if captured
    let profilePictureUrl = "";
    if (capturedImage) {
      const base64 = capturedImage.split(",")[1];
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      const imgBlob = new Blob([array], { type: "image/png" });

      const filePath = `profile-pictures/farmer-${newIdNumber}.png`;

      const { error: uploadError } = await supabase.storage
        .from("farmers-bucket")
        .upload(filePath, imgBlob, { upsert: true });

      if (uploadError) {
        console.error("Error uploading profile picture:", uploadError);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from("farmers-bucket")
          .getPublicUrl(filePath);

        profilePictureUrl = publicUrlData.publicUrl;

        // Update farmer row with profile picture
        await supabase
          .from("farmers")
          .update({ profile_picture: profilePictureUrl })
          .eq("id", farmerId);
      }
    }

    // ✅ Generate QR code
    const qrContent = newIdNumber;
    const qrDataUrl = await QRCode.toDataURL(qrContent);

    const base64 = qrDataUrl.split(",")[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    const qrBlob = new Blob([array], { type: "image/png" });

    const filePath = `qrcodes/farmer-${newIdNumber}.png`;
    const { error: uploadError } = await supabase.storage
      .from("farmers-bucket")
      .upload(filePath, qrBlob, { upsert: true });

    if (uploadError) {
      console.error("Error uploading QR code:", uploadError);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("farmers-bucket")
      .getPublicUrl(filePath);

    const qrUrl = publicUrlData.publicUrl;

    await supabase.from("farmers").update({ qrcode: qrUrl }).eq("id", farmerId);

    console.log("✅ Farmer added with QR + photo:", {
      ...insertedData,
      id_number: newIdNumber,
      qrcode: qrUrl,
      profile_picture: profilePictureUrl,
    });
  };

  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            size={"icon"}
            className="flex items-center gap-2 cursor-pointer"
          >
            <LuUserPlus />
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[600px] p-4">
          <Tabs defaultValue="personaldata">
            <TabsList className="w-full flex gap-5">
              <TabsTrigger value="personaldata">Personal Data</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="photo">Photo</TabsTrigger>
            </TabsList>

            {/* Personal Data */}
            <TabsContent value="personaldata">
              <Card>
                <CardContent className="grid gap-6">
                  {/* firstname + lastname */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-3">
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
                    <div className="grid gap-3">
                      <Label>Lastname</Label>
                      <Input
                        value={newFarmer.lastname}
                        onChange={(e) =>
                          setNewFarmer({
                            ...newFarmer,
                            lastname: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  {/* contact + email */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-3">
                      <Label>Contact Number</Label>
                      <Input
                        value={newFarmer.contact_number}
                        onChange={(e) =>
                          setNewFarmer({
                            ...newFarmer,
                            contact_number: e.target.value,
                          })
                        }
                        type="number"
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label>Email</Label>
                      <Input
                        value={newFarmer.email}
                        onChange={(e) =>
                          setNewFarmer({ ...newFarmer, email: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Address */}
            <TabsContent value="address">
              <Card>
                <CardContent className="grid gap-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-3">
                      <Label>Street/Purok</Label>
                      <Input
                        value={newFarmer.purok}
                        onChange={(e) =>
                          setNewFarmer({ ...newFarmer, purok: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label>Barangay</Label>
                      <Input
                        value={newFarmer.barangay}
                        onChange={(e) =>
                          setNewFarmer({
                            ...newFarmer,
                            barangay: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-3">
                      <Label>City</Label>
                      <Input
                        value={newFarmer.city}
                        onChange={(e) =>
                          setNewFarmer({ ...newFarmer, city: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label>Province</Label>
                      <Input
                        value={newFarmer.province}
                        onChange={(e) =>
                          setNewFarmer({
                            ...newFarmer,
                            province: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Photo Capture */}
            <TabsContent value="photo">
              <Card>
                <CardContent className="flex flex-col items-center gap-4">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/png"
                    width={320}
                    height={240}
                    videoConstraints={{ facingMode: "user" }}
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
            <Button type="button" onClick={handleAddFarmer}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddFarmerDialog;
