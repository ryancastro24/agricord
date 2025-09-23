import { useState, useEffect } from "react";
import supabase from "@/db/config"; // adjust path
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

// Define staff type
type Staff = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
};

const Staffs = () => {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [search, setSearch] = useState("");
  const [newStaff, setNewStaff] = useState({
    email: "",
    password: "",
    full_name: "",
  });

  // Fetch staff list
  const fetchStaffs = async () => {
    const { data, error } = await supabase.from("staff").select("*");
    if (error) console.error(error);
    else setStaffs(data as Staff[]);
  };

  useEffect(() => {
    fetchStaffs();
  }, []);

  // Create staff account (admin)
  const handleCreateStaff = async () => {
    const response = await fetch("/api/createStaff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStaff),
    });

    if (response.ok) {
      setNewStaff({ email: "", password: "", full_name: "" });
      fetchStaffs();
    } else {
      console.error("Failed to create staff");
    }
  };

  // Update staff role/status
  const handleUpdateStaff = async (id: string, updates: Partial<Staff>) => {
    const { error } = await supabase.from("staff").update(updates).eq("id", id);
    if (error) console.error(error);
    else fetchStaffs();
  };

  // Delete staff
  const handleDeleteStaff = async (id: string) => {
    const { error } = await supabase.from("staff").delete().eq("id", id);
    if (error) console.error(error);
    else fetchStaffs();
  };

  // Filtered staff list
  const filteredStaffs = staffs.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
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
          <DialogContent>
            <div className="space-y-4">
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
              <div>
                <Label>Full Name</Label>
                <Input
                  value={newStaff.full_name}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, full_name: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleCreateStaff}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Full Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStaffs.map((staff) => (
            <TableRow key={staff.id}>
              <TableCell>{staff.full_name}</TableCell>
              <TableCell>{staff.email}</TableCell>
              <TableCell>{staff.role}</TableCell>
              <TableCell>{staff.status}</TableCell>
              <TableCell className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    handleUpdateStaff(staff.id, { role: "manager" })
                  }
                >
                  Promote
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteStaff(staff.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Staffs;
