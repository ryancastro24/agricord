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
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import supabase from "@/db/config";

// ✅ TypeScript interface matching your public "users" table
type Staff = {
  id: string;
  auth_id: string;
  firstname: string;
  lastname: string;
  email: string;
  contact: string | null;
  address: string | null;
  role: string;
  profile_picture: string | null;
  is_active: boolean;
  email_verified: boolean;
  created_at?: string;
};

// ✅ Loader fetches from public.users
export async function loader() {
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw error;
  return { users: data as Staff[] };
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

  const webcamRef = useRef<Webcam>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // ✅ Capture profile picture
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setNewStaff({ ...newStaff, profile_picture: imageSrc });
      setIsCameraOpen(false);
    }
  }, [newStaff]);

  // ✅ Create new staff account (Auth + users table)
  const handleCreateStaff = async () => {
    const {
      firstname,
      lastname,
      email,
      password,
      address,
      contact,
      role,
      profile_picture,
    } = newStaff;

    if (!firstname || !lastname || !email || !password) {
      alert("Please fill in all required fields");
      return;
    }

    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstname,
          lastname,
          address,
          contact,
          role,
          profile_picture,
        },
      },
    });

    if (authError) {
      alert(authError.message);
      console.error("Auth error:", authError);
      return;
    }

    // Step 2: Add to public.users
    const { error: insertError } = await supabase.from("users").insert({
      auth_id: authData.user?.id,
      firstname,
      lastname,
      email,
      profile_picture,
      address,
      contact,
      role,
      email_verified: false,
      is_active: true,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      alert("Failed to save to users table.");
      return;
    }

    alert("Staff added successfully!");
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
  };

  // ✅ Filter staff list
  const filteredStaffs = users.filter((s) => {
    const fullname = `${s.firstname ?? ""} ${s.lastname ?? ""}`.trim();
    return (
      fullname.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* 🔍 Search and Add Staff */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search staff..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-1/3"
        />

        {/* ➕ Add Staff Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Staff</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Staff</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
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
                    <tr>
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
                    <tr>
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
                    <tr>
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
                    <tr>
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
                    <tr>
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
                    <tr>
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
                        {/* 📸 Camera Dialog */}
                        <Dialog
                          open={isCameraOpen}
                          onOpenChange={setIsCameraOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsCameraOpen(true)}
                            >
                              <Camera className="w-4 h-4 mr-1" />
                              Take Picture
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md flex flex-col items-center gap-4">
                            <Webcam
                              audio={false}
                              ref={webcamRef}
                              screenshotFormat="image/jpeg"
                              className="rounded-md w-full aspect-video"
                              videoConstraints={{ facingMode: "user" }}
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

      {/* 🧑‍💼 Staff List */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Profile</TableHead>
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
            const fullname = `${staff.firstname} ${staff.lastname}`;
            return (
              <TableRow key={staff.id}>
                <TableCell>
                  {staff.profile_picture ? (
                    <img
                      src={staff.profile_picture}
                      alt={fullname}
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                  )}
                </TableCell>
                <TableCell>{fullname}</TableCell>
                <TableCell>{staff.email}</TableCell>
                <TableCell>{staff.contact ?? "N/A"}</TableCell>
                <TableCell>{staff.address ?? "N/A"}</TableCell>
                <TableCell>{staff.role}</TableCell>
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
