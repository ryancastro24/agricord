import { useState, useRef, useCallback } from "react";
import { useLoaderData } from "react-router-dom";
import Webcam from "react-webcam";
import { Camera } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getUsers, createUser } from "@/backend/users";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Supabase user type (simplified)
type Staff = {
  id: string;
  email: string;
  user_metadata: {
    firstname?: string;
    lastname?: string;
    address?: string;
    contact?: string;
    role?: string;
    profile_picture?: string;
    is_active?: boolean;
  };
};

export async function loader() {
  const users = await getUsers();
  return { users };
}

const Staffs = () => {
  const { users } = useLoaderData() as { users: Staff[] };

  const [search, setSearch] = useState("");
  const [newStaff, setNewStaff] = useState({
    email: "",
    password: "",
    firstname: "",
    lastname: "",
    role: "staff",
    contact: "",
    address: "",
    profile_picture: "",
  });

  // camera state
  const webcamRef = useRef<Webcam>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setNewStaff({ ...newStaff, profile_picture: imageSrc });
      setIsCameraOpen(false);
    }
  }, [newStaff]);

  // Create staff account via createUser()
  const handleCreateStaff = async () => {
    try {
      await createUser(newStaff); // axios POST helper
      setNewStaff({
        email: "",
        password: "",
        firstname: "",
        lastname: "",
        role: "staff",
        contact: "",
        address: "",
        profile_picture: "",
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to create staff:", error);
    }
  };

  // Filtered staff list
  const filteredStaffs = users.filter((s) => {
    const fullname = `${s.user_metadata.firstname ?? ""} ${
      s.user_metadata.lastname ?? ""
    }`.trim();
    return (
      fullname.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search staff..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-1/3"
        />

        {/* Add Staff Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Staff</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-2">Add New Staff</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 w-1/3">
                        <Label>Email</Label>
                      </td>
                      <td className="p-2">
                        <Input
                          type="email"
                          value={newStaff.email}
                          onChange={(e) =>
                            setNewStaff({ ...newStaff, email: e.target.value })
                          }
                        />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">
                        <Label>Password</Label>
                      </td>
                      <td className="p-2">
                        <Input
                          type="password"
                          value={newStaff.password}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              password: e.target.value,
                            })
                          }
                        />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">
                        <Label>First Name</Label>
                      </td>
                      <td className="p-2">
                        <Input
                          value={newStaff.firstname}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              firstname: e.target.value,
                            })
                          }
                        />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">
                        <Label>Last Name</Label>
                      </td>
                      <td className="p-2">
                        <Input
                          value={newStaff.lastname}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              lastname: e.target.value,
                            })
                          }
                        />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">
                        <Label>Role</Label>
                      </td>
                      <td className="p-2">
                        <Select
                          value={newStaff.role}
                          onValueChange={(val) =>
                            setNewStaff({ ...newStaff, role: val })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="chairman">Chairman</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">
                        <Label>Contact</Label>
                      </td>
                      <td className="p-2">
                        <Input
                          value={newStaff.contact}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              contact: e.target.value,
                            })
                          }
                        />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">
                        <Label>Address</Label>
                      </td>
                      <td className="p-2">
                        <Input
                          value={newStaff.address}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              address: e.target.value,
                            })
                          }
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2">
                        <Label>Profile Picture</Label>
                      </td>
                      <td className="p-2 flex items-center gap-3">
                        <Dialog
                          open={isCameraOpen}
                          onOpenChange={setIsCameraOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                              onClick={() => setIsCameraOpen(true)}
                            >
                              <Camera className="w-4 h-4" />
                              Take Picture
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md flex flex-col items-center gap-4">
                            <Webcam
                              audio={false}
                              ref={webcamRef}
                              screenshotFormat="image/jpeg"
                              className="rounded-md w-full aspect-video"
                              videoConstraints={{
                                facingMode: "user",
                              }}
                            />
                            <Button className="w-full" onClick={capture}>
                              Capture
                            </Button>
                          </DialogContent>
                        </Dialog>

                        {newStaff.profile_picture && (
                          <img
                            src={newStaff.profile_picture}
                            alt="Preview"
                            className="w-12 h-12 rounded-full object-cover border"
                          />
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="pt-4">
                <Button className="w-full" onClick={handleCreateStaff}>
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff List */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Full Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStaffs.map((staff) => {
            const fullname = `${staff.user_metadata.firstname ?? ""} ${
              staff.user_metadata.lastname ?? ""
            }`.trim();

            return (
              <TableRow key={staff.id}>
                <TableCell>{fullname || "N/A"}</TableCell>
                <TableCell>{staff.email}</TableCell>
                <TableCell>{staff.user_metadata.contact ?? "N/A"}</TableCell>
                <TableCell>{staff.user_metadata.address ?? "N/A"}</TableCell>
                <TableCell>{staff.user_metadata.role ?? "N/A"}</TableCell>
                <TableCell className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    Promote
                  </Button>
                  <Button variant="destructive" size="sm">
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default Staffs;
