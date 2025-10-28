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

const AddLiveStockFarmerDialog = ({ onSuccess }: any) => {
  const profileCamRef = useRef<Webcam>(null);
  const idCamRef = useRef<Webcam>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [idImage, setIdImage] = useState<string | null>(null);

  const [newFarmer, setNewFarmer] = useState({
    id_number: "",
    firstname: "",
    lastname: "",
    middlename: "",
    sex: "",
    bldg_no: "",
    street: "",
    barangay: "",
    city: "",
    province: "",
    region: "",
    date_of_birth: "",
    place_of_birth: "",
    contact_number: "",
    highest_formal_education: "",
    religion: "",
    civil_status: "",
    is_married: false,
    is_with_disability: false,
    is_4ps_beneficiary: false,
    have_government_id: false,
    government_id_number: "",
    cooperative: "",
    person_to_notify_emergency: "",
    person_to_notify_emergency_contact_number: "",
  });

  const [farmProfile, setFarmProfile] = useState({
    farmer_role: "",
    farmer_activity: "",
    kind_of_work: "",
    type_of_fishing_activity: "",
    gross_annual_income_last_year: "",
    non_gross_annual_income_last_year: "",
  });

  // 📸 Capture photos
  const captureProfilePhoto = () => {
    if (profileCamRef.current) {
      const img = profileCamRef.current.getScreenshot();
      setProfileImage(img || null);
    }
  };

  const captureIdPhoto = () => {
    if (idCamRef.current) {
      const img = idCamRef.current.getScreenshot();
      setIdImage(img || null);
    }
  };

  // 📤 Upload helper
  const uploadImage = async (path: string, base64Img: string) => {
    const base64 = base64Img.split(",")[1];
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    const blob = new Blob([array], { type: "image/png" });

    const { error } = await supabase.storage
      .from("farmers-bucket")
      .upload(path, blob, { upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from("farmers-bucket").getPublicUrl(path);
    return data.publicUrl;
  };

  // 📤 Handle uploads
  const handleUploads = async (farmerId: string, idNumber: string) => {
    if (profileImage) {
      const profilePath = `profile-pictures/farmer-${idNumber}.png`;
      const profileUrl = await uploadImage(profilePath, profileImage);
      await supabase
        .from("farmers")
        .update({ profile_picture: profileUrl })
        .eq("id", farmerId);
    }

    if (idImage && newFarmer.government_id_number) {
      const idPath = `id-photos/${newFarmer.government_id_number}.png`;
      const idUrl = await uploadImage(idPath, idImage);
      await supabase
        .from("farmers")
        .update({
          government_id_image: idUrl,
          government_id_number: newFarmer.government_id_number,
        })
        .eq("id", farmerId);

      console.log("ID image uploaded", idUrl);
    }

    const qrDataUrl = await QRCode.toDataURL(idNumber);
    const qrUrl = await uploadImage(
      `qrcodes/farmer-${idNumber}.png`,
      qrDataUrl
    );
    await supabase.from("farmers").update({ qrcode: qrUrl }).eq("id", farmerId);
  };

  // 🧾 Save new farmer
  const handleAddFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmer.firstname || !newFarmer.lastname || !newFarmer.id_number) {
      toast.error("Please complete all required fields.");
      return;
    }

    try {
      setLoading(true);

      const { data: insertedFarmer, error: insertError } = await supabase
        .from("farmers")
        .insert([newFarmer])
        .select()
        .single();

      if (insertError) throw insertError;

      const { error: profileError } = await supabase
        .from("farm_profile")
        .insert([{ farmer_id: insertedFarmer.id, ...farmProfile }]);

      if (profileError) throw profileError;

      try {
        await handleUploads(insertedFarmer.id, newFarmer.id_number);
      } catch (uploadErr) {
        console.warn("⚠️ Upload failed:", uploadErr);
        toast.warning("Farmer saved but some uploads failed.");
      }

      toast.success("✅ Farmer successfully added!");
      setOpen(false);
      setNewFarmer({
        id_number: "",
        firstname: "",
        lastname: "",
        middlename: "",
        sex: "",
        bldg_no: "",
        street: "",
        barangay: "",
        city: "",
        province: "",
        region: "",
        date_of_birth: "",
        place_of_birth: "",
        contact_number: "",
        highest_formal_education: "",
        religion: "",
        civil_status: "",
        is_married: false,
        is_with_disability: false,
        is_4ps_beneficiary: false,
        have_government_id: false,
        government_id_number: "",
        cooperative: "",
        person_to_notify_emergency: "",
        person_to_notify_emergency_contact_number: "",
      });
      onSuccess?.();

      setProfileImage(null);
      setIdImage(null);
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
        <Button size="icon">
          <LuUserPlus />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl w-full p-4 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Farmer</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personal">
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="farm">Farm Profile</TabsTrigger>
            <TabsTrigger value="idphoto">Government ID</TabsTrigger>
            <TabsTrigger value="photo">Profile Photo</TabsTrigger>
          </TabsList>

          {/* PERSONAL TAB */}
          <TabsContent value="personal">
            <Card>
              <CardContent className="grid gap-3 py-4">
                <Label>ID Number</Label>
                <Input
                  value={newFarmer.id_number}
                  onChange={(e) =>
                    setNewFarmer({ ...newFarmer, id_number: e.target.value })
                  }
                />

                <div className="grid grid-cols-3 gap-3">
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
                    <Label>Middlename</Label>
                    <Input
                      value={newFarmer.middlename}
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          middlename: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
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

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="sex">Sex</Label>
                    <select
                      id="sex"
                      value={newFarmer.sex}
                      onChange={(e) =>
                        setNewFarmer({ ...newFarmer, sex: e.target.value })
                      }
                      className="border border-gray-300 rounded-md p-2 w-full"
                    >
                      <option value="">Select Sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="civil_status">Civil Status</Label>
                    <select
                      id="civil_status"
                      value={newFarmer.civil_status}
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          civil_status: e.target.value,
                        })
                      }
                      className="border border-gray-300 rounded-md p-2 w-full"
                    >
                      <option value="">Select Civil Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                  </div>

                  <div>
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={newFarmer.date_of_birth}
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          date_of_birth: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Place of Birth</Label>
                    <Input
                      value={newFarmer.place_of_birth}
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          place_of_birth: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Contact Number</Label>
                    <Input
                      value={newFarmer.contact_number}
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          contact_number: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Highest Formal Education</Label>
                    <Input
                      value={newFarmer.highest_formal_education}
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          highest_formal_education: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 items-center">
                  <div className="col-span-1">
                    <Label>Religion</Label>
                    <Input
                      value={newFarmer.religion}
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          religion: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      checked={newFarmer.is_with_disability}
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          is_with_disability: e.target.checked,
                        })
                      }
                    />
                    <Label>Has Disability</Label>
                  </div>

                  <div className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      checked={newFarmer.is_4ps_beneficiary}
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          is_4ps_beneficiary: e.target.checked,
                        })
                      }
                    />
                    <Label>4Ps Beneficiary</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ADDRESS TAB */}
          <TabsContent value="address">
            <Card>
              <CardContent className="grid gap-3 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Bldg No.</Label>
                    <Input
                      value={newFarmer.bldg_no}
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          bldg_no: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Street</Label>
                    <Input
                      value={newFarmer.street}
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          street: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
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

                  <div>
                    <Label>City</Label>
                    <Input
                      value={newFarmer.city}
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          city: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
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

                  <div>
                    <Label>Region</Label>
                    <Input
                      value={newFarmer.region}
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          region: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Emergency Contact Person</Label>
                    <Input
                      value={newFarmer.person_to_notify_emergency}
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          person_to_notify_emergency: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Emergency Contact Number</Label>
                    <Input
                      value={
                        newFarmer.person_to_notify_emergency_contact_number
                      }
                      onChange={(e) =>
                        setNewFarmer({
                          ...newFarmer,
                          person_to_notify_emergency_contact_number:
                            e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Cooperative</Label>
                  <Input
                    value={newFarmer.cooperative}
                    onChange={(e) =>
                      setNewFarmer({
                        ...newFarmer,
                        cooperative: e.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FARM PROFILE TAB */}
          <TabsContent value="farm">
            <Card>
              <CardContent className="grid gap-3 py-4">
                <div>
                  <Label htmlFor="farmer_role">Farmer Role</Label>
                  <select
                    id="farmer_role"
                    value={farmProfile.farmer_role}
                    onChange={(e) =>
                      setFarmProfile({
                        ...farmProfile,
                        farmer_role: e.target.value,
                      })
                    }
                    className="border border-gray-300 rounded-md p-2 w-full"
                  >
                    <option value="">Select Farmer Role</option>
                    <option value="farmer">Farmer</option>
                    <option value="laborer">Laborer</option>
                    <option value="fishing">Fishing</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <Label>Farmer Activity</Label>
                <Input
                  value={farmProfile.farmer_activity}
                  onChange={(e) =>
                    setFarmProfile({
                      ...farmProfile,
                      farmer_activity: e.target.value,
                    })
                  }
                />
                <Label>Kind of Work</Label>
                <Input
                  value={farmProfile.kind_of_work}
                  onChange={(e) =>
                    setFarmProfile({
                      ...farmProfile,
                      kind_of_work: e.target.value,
                    })
                  }
                />
                <Label>Type of Fishing Activity</Label>
                <Input
                  value={farmProfile.type_of_fishing_activity}
                  onChange={(e) =>
                    setFarmProfile({
                      ...farmProfile,
                      type_of_fishing_activity: e.target.value,
                    })
                  }
                />
                <Label>Gross Annual Income (₱)</Label>
                <Input
                  type="number"
                  value={farmProfile.gross_annual_income_last_year}
                  onChange={(e) =>
                    setFarmProfile({
                      ...farmProfile,
                      gross_annual_income_last_year: e.target.value,
                    })
                  }
                />
                <Label>Non-Gross Annual Income (₱)</Label>
                <Input
                  type="number"
                  value={farmProfile.non_gross_annual_income_last_year}
                  onChange={(e) =>
                    setFarmProfile({
                      ...farmProfile,
                      non_gross_annual_income_last_year: e.target.value,
                    })
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* GOVERNMENT ID TAB */}
          <TabsContent value="idphoto">
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-4">
                <Label>Government ID Number</Label>
                <Input
                  type="text"
                  value={newFarmer.government_id_number}
                  onChange={(e) =>
                    setNewFarmer({
                      ...newFarmer,
                      government_id_number: e.target.value,
                    })
                  }
                />

                <Webcam
                  ref={idCamRef}
                  audio={false}
                  screenshotFormat="image/png"
                  width={320}
                  height={240}
                  videoConstraints={{ facingMode: "user" }}
                  className="rounded-md border"
                />

                <Button onClick={captureIdPhoto}>Capture ID Photo</Button>

                {idImage && (
                  <img
                    src={idImage}
                    alt="ID Capture"
                    className="w-40 h-40 object-cover border rounded-md"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROFILE PHOTO TAB */}
          <TabsContent value="photo">
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-4">
                <Webcam
                  ref={profileCamRef}
                  audio={false}
                  screenshotFormat="image/png"
                  width={320}
                  height={240}
                  videoConstraints={{ facingMode: "user" }}
                  className="rounded-md border"
                />

                <Button variant="outline" onClick={captureProfilePhoto}>
                  Capture Profile Photo
                </Button>

                {profileImage && (
                  <img
                    src={profileImage}
                    alt="Profile Capture"
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
            disabled={
              loading ||
              !newFarmer.id_number ||
              !newFarmer.firstname ||
              !newFarmer.lastname ||
              !profileImage ||
              !idImage ||
              !newFarmer.government_id_number ||
              !newFarmer.contact_number ||
              !newFarmer.person_to_notify_emergency_contact_number ||
              !newFarmer.person_to_notify_emergency ||
              !newFarmer.bldg_no ||
              !newFarmer.street ||
              !newFarmer.barangay ||
              !newFarmer.city ||
              !newFarmer.province ||
              !newFarmer.region ||
              !newFarmer.date_of_birth ||
              !newFarmer.sex ||
              !newFarmer.civil_status ||
              !newFarmer.highest_formal_education ||
              !newFarmer.religion ||
              !newFarmer.cooperative ||
              !newFarmer.middlename ||
              !newFarmer.place_of_birth ||
              !newFarmer.contact_number ||
              !newFarmer.person_to_notify_emergency_contact_number ||
              !newFarmer.person_to_notify_emergency ||
              !farmProfile.farmer_role ||
              !farmProfile.farmer_activity ||
              !farmProfile.kind_of_work ||
              !farmProfile.type_of_fishing_activity ||
              !farmProfile.gross_annual_income_last_year ||
              !farmProfile.non_gross_annual_income_last_year
            }
          >
            {loading ? "Saving..." : "Save Farmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddLiveStockFarmerDialog;
