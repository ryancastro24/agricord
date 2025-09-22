import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import supabase from "@/db/config";

const EditFarmerData = ({
  openEditFarmerDialog,
  setOpenEditFarmerDialog,
  editFarmer,
}: any) => {
  const [farmerUpdateData, setFarmerUpdateData] = useState({
    firstname: "",
    lastname: "",
    purok: "",
    barangay: "",
    city: "",
    province: "",
    contact_number: "",
    email: "",
    gender: "",
  });

  useEffect(() => {
    if (editFarmer) {
      setFarmerUpdateData(editFarmer);
    }
  }, [editFarmer]);

  // 🔧 Update function
  const handleUpdateFarmer = async () => {
    if (!editFarmer?.id) return;

    const { error } = await supabase
      .from("farmers")
      .update(farmerUpdateData)
      .eq("id", editFarmer.id);

    if (error) {
      console.error("Error updating farmer:", error.message);
      alert("Failed to update farmer ❌");
    } else {
      alert("Farmer updated successfully ✅");
      setOpenEditFarmerDialog(false); // close dialog after update
    }
  };

  return (
    <div>
      <Dialog
        open={openEditFarmerDialog}
        onOpenChange={setOpenEditFarmerDialog}
      >
        <DialogContent className="w-max-lg p-4">
          <Tabs defaultValue="personaldata">
            <TabsList className="w-full flex gap-5">
              <TabsTrigger value="personaldata">Personal Data</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
            </TabsList>

            {/* Personal Data */}
            <TabsContent value="personaldata">
              <Card>
                <CardContent className="grid gap-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-3">
                      <Label>Firstname</Label>
                      <Input
                        value={farmerUpdateData.firstname}
                        onChange={(e) =>
                          setFarmerUpdateData({
                            ...farmerUpdateData,
                            firstname: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label>Lastname</Label>
                      <Input
                        value={farmerUpdateData.lastname}
                        onChange={(e) =>
                          setFarmerUpdateData({
                            ...farmerUpdateData,
                            lastname: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-3">
                      <Label>Contact Number</Label>
                      <Input
                        value={farmerUpdateData.contact_number}
                        onChange={(e) =>
                          setFarmerUpdateData({
                            ...farmerUpdateData,
                            contact_number: e.target.value,
                          })
                        }
                        type="number"
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label>Email</Label>
                      <Input
                        value={farmerUpdateData.email}
                        onChange={(e) =>
                          setFarmerUpdateData({
                            ...farmerUpdateData,
                            email: e.target.value,
                          })
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
                        value={farmerUpdateData.purok}
                        onChange={(e) =>
                          setFarmerUpdateData({
                            ...farmerUpdateData,
                            purok: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label>Barangay</Label>
                      <Input
                        value={farmerUpdateData.barangay}
                        onChange={(e) =>
                          setFarmerUpdateData({
                            ...farmerUpdateData,
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
                        value={farmerUpdateData.city}
                        onChange={(e) =>
                          setFarmerUpdateData({
                            ...farmerUpdateData,
                            city: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label>Province</Label>
                      <Input
                        value={farmerUpdateData.province}
                        onChange={(e) =>
                          setFarmerUpdateData({
                            ...farmerUpdateData,
                            province: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" onClick={handleUpdateFarmer}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditFarmerData;
