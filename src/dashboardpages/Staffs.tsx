import { useState, useRef, useCallback, useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import Webcam from "react-webcam";
import { Camera, Loader2, MoreHorizontal } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
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
  const [, setDeletingId] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

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

  useEffect(() => {
    if (loaderData) {
      const timer = setTimeout(() => {
        setUsers(loaderData.users);
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loaderData]);

  // ✅ Capture photo
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setNewStaff((prev) => ({ ...prev, profile_picture: imageSrc }));
      setIsCameraOpen(false);
    }
  }, []);

  // ✅ Add new staff
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

      const { data: refreshed } = await supabase.from("users").select("*");
      if (refreshed) setUsers(refreshed);
    } catch (err: any) {
      toast.error(err.message || "Failed to add staff");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ Update staff
  const handleUpdateStaff = async () => {
    if (!editingStaff) return;
    try {
      const { error } = await supabase
        .from("users")
        .update({
          firstname: editingStaff.firstname,
          lastname: editingStaff.lastname,
          contact: editingStaff.contact,
          address: editingStaff.address,
          role: editingStaff.role,
        })
        .eq("id", editingStaff.id);

      if (error) throw error;
      toast.success("✅ Staff updated successfully!");

      const { data: refreshed } = await supabase.from("users").select("*");
      if (refreshed) setUsers(refreshed);
      setEditingStaff(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update staff");
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
    } catch {
      toast.error("Failed to delete staff");
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ Search
  const filteredStaffs = users.filter((s) => {
    const fullname = `${s.firstname ?? ""} ${s.lastname ?? ""}`.trim();
    return (
      fullname.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  // 🦴 Loading skeleton
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

  return (
    <div className="p-6 space-y-6">
      {/* Search + Add */}
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search staff..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-1/3"
        />

        {/* Add New Staff */}
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Staff</Button>
          </DialogTrigger>

          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add New Staff</DialogTitle>
            </DialogHeader>

            {/* Add Staff Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Email / Password */}
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={newStaff.password}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, password: e.target.value })
                  }
                />
              </div>

              {/* First / Last name */}
              <div>
                <Label>First Name</Label>
                <Input
                  value={newStaff.firstname}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, firstname: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={newStaff.lastname}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, lastname: e.target.value })
                  }
                />
              </div>

              {/* Contact / Address */}
              <div>
                <Label>Contact</Label>
                <Input
                  value={newStaff.contact}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, contact: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={newStaff.address}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, address: e.target.value })
                  }
                />
              </div>

              {/* Role / Category */}
              <div>
                <Label>Role</Label>
                <Select
                  value={newStaff.role}
                  onValueChange={(val) =>
                    setNewStaff({ ...newStaff, role: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="chairman">Chairman</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={newStaff.category}
                  onValueChange={(val) =>
                    setNewStaff({ ...newStaff, category: val })
                  }
                >
                  <SelectTrigger>
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
                      <Button variant="outline" size="sm">
                        <Camera className="w-4 h-4 mr-1" /> Take Picture
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md flex flex-col items-center gap-4">
                      <Webcam
                        ref={webcamRef}
                        audio={false}
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

      {/* Staff Table */}
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setEditingStaff(staff)}>
                        Update
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteStaff(staff.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Update Dialog */}
      <Dialog open={!!editingStaff} onOpenChange={() => setEditingStaff(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Staff</DialogTitle>
          </DialogHeader>
          {editingStaff && (
            <div className="space-y-3 mt-4">
              <div>
                <Label>First Name</Label>
                <Input
                  value={editingStaff.firstname}
                  onChange={(e) =>
                    setEditingStaff({
                      ...editingStaff,
                      firstname: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={editingStaff.lastname}
                  onChange={(e) =>
                    setEditingStaff({
                      ...editingStaff,
                      lastname: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Contact</Label>
                <Input
                  value={editingStaff.contact ?? ""}
                  onChange={(e) =>
                    setEditingStaff({
                      ...editingStaff,
                      contact: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={editingStaff.address ?? ""}
                  onChange={(e) =>
                    setEditingStaff({
                      ...editingStaff,
                      address: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={editingStaff.role}
                  onValueChange={(val) =>
                    setEditingStaff({ ...editingStaff, role: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="chairman">Chairman</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-4">
                <Button className="w-full" onClick={handleUpdateStaff}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Staffs;
