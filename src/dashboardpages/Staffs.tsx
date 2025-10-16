import { useState, useRef, useCallback, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import Webcam from "react-webcam";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { Skeleton } from "@/components/ui/skeleton";
import supabase from "@/db/config";

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

// ✅ Loader
export async function loader() {
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw error;
  return { users: data as Staff[] };
}

const Staffs = () => {
  const loaderData = useLoaderData() as { users: Staff[] } | null;
  const [users, setUsers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const [newStaff, setNewStaff] = useState({
    email: "",
    password: "",
    firstname: "",
    lastname: "",
    role: "staff",
    contact: "",
    address: "",
    profile_picture: "",
    category: "",
  });

  // ✅ Initialize data
  useEffect(() => {
    if (loaderData) {
      const timer = setTimeout(() => {
        setUsers(loaderData.users);
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loaderData]);

  // ✅ Capture profile picture
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setNewStaff((prev) => ({ ...prev, profile_picture: imageSrc }));
      setIsCameraOpen(false);
    }
  }, []);

  // ✅ Create new staff
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
      category,
    } = newStaff;

    if (!firstname || !lastname || !email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);

      // Step 1: Create Auth User
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

      if (authError) throw authError;

      // Step 2: Insert into users table
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
        category,
      });

      if (insertError) throw insertError;

      toast.success("✅ Staff added successfully!");
      setNewStaff({
        email: "",
        password: "",
        firstname: "",
        lastname: "",
        role: "staff",
        contact: "",
        address: "",
        profile_picture: "",
        category: "",
      });

      // Refresh users
      const { data: refreshed } = await supabase.from("users").select("*");
      if (refreshed) setUsers(refreshed);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add staff");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Delete staff
  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff?")) return;

    try {
      setDeletingId(id);
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;

      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("🗑️ Staff deleted successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to delete staff");
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ Filter search
  const filteredStaffs = users.filter((s) => {
    const fullname = `${s.firstname ?? ""} ${s.lastname ?? ""}`.trim();
    return (
      fullname.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  // ==========================================================
  // 🦴 LOADING SKELETON
  // ==========================================================
  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-in fade-in-0 duration-300">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/3 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
        <div className="border rounded-lg p-4">
          <Skeleton className="h-6 w-1/4 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-1/6" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-6 w-1/6" />
                <Skeleton className="h-6 w-1/6" />
                <Skeleton className="h-6 w-1/6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ✅ MAIN CONTENT
  // ==========================================================
  return (
    <div className="p-6 space-y-6">
      {/* 🔍 Search & Add Staff */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search staff..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-1/3"
        />

        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Staff</Button>
          </DialogTrigger>

          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add New Staff</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Email */}
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Enter staff email"
                  value={newStaff.email}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, email: e.target.value })
                  }
                />
              </div>

              {/* Password */}
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={newStaff.password}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, password: e.target.value })
                  }
                />
              </div>

              {/* First Name */}
              <div>
                <Label>First Name</Label>
                <Input
                  type="text"
                  placeholder="Enter first name"
                  value={newStaff.firstname}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, firstname: e.target.value })
                  }
                />
              </div>

              {/* Last Name */}
              <div>
                <Label>Last Name</Label>
                <Input
                  type="text"
                  placeholder="Enter last name"
                  value={newStaff.lastname}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, lastname: e.target.value })
                  }
                />
              </div>

              {/* Contact */}
              <div>
                <Label>Contact</Label>
                <Input
                  type="text"
                  placeholder="Enter contact number"
                  value={newStaff.contact}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, contact: e.target.value })
                  }
                />
              </div>

              {/* Address */}
              <div>
                <Label>Address</Label>
                <Input
                  type="text"
                  placeholder="Enter address"
                  value={newStaff.address}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, address: e.target.value })
                  }
                />
              </div>

              {/* Role */}
              <div>
                <Label>Role</Label>
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
              </div>

              {/* Category */}
              <div>
                <Label>Category</Label>
                <Select
                  value={newStaff.category}
                  onValueChange={(val) =>
                    setNewStaff({ ...newStaff, category: val })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corn">Corn</SelectItem>
                    <SelectItem value="crops">Crops</SelectItem>
                    <SelectItem value="fishery">Fishery</SelectItem>
                    <SelectItem value="livestock">Livestock</SelectItem>
                    <SelectItem value="machinery">Machinery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Profile Picture */}
              <div className="md:col-span-2">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCameraOpen(true)}
                      >
                        <Camera className="w-4 h-4 mr-1" /> Take Picture
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
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button
                className="w-full"
                onClick={handleCreateStaff}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 🧑‍💼 Staff Table */}
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
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deletingId === staff.id}
                    onClick={() => handleDeleteStaff(staff.id)}
                  >
                    {deletingId === staff.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
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
