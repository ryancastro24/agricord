import { useState, useEffect } from "react";
import supabase from "@/db/config";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AiOutlineDelete } from "react-icons/ai";

import { LuUserPen } from "react-icons/lu";
// Type definition
type Chairman = {
  id: string;
  firstname: string;
  lastname: string;
  address: string;
  contact_number: string;
};

export async function loader() {
  const { data, error } = await supabase.from("chairmans").select("*");

  if (error) {
    console.error("Could not fetch chairmans:", error);
    return { chairmans: [], error: "Could not fetch the data" };
  }

  return { chairmans: data || [], error: null };
}

const Chairmans = () => {
  const [chairmans, setChairmans] = useState<Chairman[]>([]);
  const [search, setSearch] = useState("");
  const [newChairman, setNewChairman] = useState({
    firstname: "",
    lastname: "",
    address: "",
    contact_number: "",
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChairman, setEditingChairman] = useState<Chairman | null>(null);

  // Fetch chairman list
  const fetchChairmans = async () => {
    const { data, error } = await supabase.from("chairmans").select("*");
    if (error) console.error(error);
    else setChairmans(data as Chairman[]);
  };

  useEffect(() => {
    fetchChairmans();
  }, []);

  // Create or Update chairman
  const handleSaveChairman = async () => {
    if (editingChairman) {
      // Update
      const { error } = await supabase
        .from("chairmans")
        .update(newChairman)
        .eq("id", editingChairman.id);

      if (error) console.error(error);
    } else {
      // Insert
      const { error } = await supabase.from("chairmans").insert([newChairman]);
      if (error) console.error(error);
    }

    setNewChairman({
      firstname: "",
      lastname: "",
      address: "",
      contact_number: "",
    });
    setEditingChairman(null);
    setIsDialogOpen(false);
    fetchChairmans();
  };

  // Delete chairman
  const handleDeleteChairman = async (id: string) => {
    const { error } = await supabase.from("chairmans").delete().eq("id", id);
    if (error) console.error(error);
    else fetchChairmans();
  };

  // Open dialog for editing
  const handleEditChairman = (chairman: Chairman) => {
    setEditingChairman(chairman);
    setNewChairman({
      firstname: chairman.firstname,
      lastname: chairman.lastname,
      address: chairman.address,
      contact_number: chairman.contact_number,
    });
    setIsDialogOpen(true);
  };

  // Filter
  const filteredChairmans = chairmans.filter(
    (c) =>
      c.firstname.toLowerCase().includes(search.toLowerCase()) ||
      c.lastname.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex gap-4">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingChairman(null);
                setNewChairman({
                  firstname: "",
                  lastname: "",
                  address: "",
                  contact_number: "",
                });
              }}
            >
              Add Chairman
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingChairman ? "Update Chairman" : "Add Chairman"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>Firstname</Label>
                <Input
                  value={newChairman.firstname}
                  onChange={(e) =>
                    setNewChairman({
                      ...newChairman,
                      firstname: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Lastname</Label>
                <Input
                  value={newChairman.lastname}
                  onChange={(e) =>
                    setNewChairman({
                      ...newChairman,
                      lastname: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Address</Label>
                <Input
                  value={newChairman.address}
                  onChange={(e) =>
                    setNewChairman({
                      ...newChairman,
                      address: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Contact Number</Label>
                <Input
                  value={newChairman.contact_number}
                  onChange={(e) =>
                    setNewChairman({
                      ...newChairman,
                      contact_number: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveChairman}>
                {editingChairman ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Firstname</TableHead>
            <TableHead>Lastname</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Contact Number</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredChairmans.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.firstname}</TableCell>
              <TableCell>{c.lastname}</TableCell>
              <TableCell>{c.address}</TableCell>
              <TableCell>{c.contact_number}</TableCell>
              <TableCell className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => handleEditChairman(c)}
                >
                  <LuUserPen />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteChairman(c.id)}
                >
                  <AiOutlineDelete />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Chairmans;
