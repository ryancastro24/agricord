import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

// Types
interface Farmer {
  id_number: string;
  firstname: string;
  lastname: string;
  category: string;
}

interface Transaction {
  date: Date;
  details: string;
}

type Transactions = Record<string, Transaction[]>;

const FarmerAttendance = () => {
  const today = new Date();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);

  // Sample data
  const farmers: Farmer[] = [
    {
      id_number: "F001",
      firstname: "Juan",
      lastname: "Dela Cruz",
      category: "Rice",
    },
    {
      id_number: "F002",
      firstname: "Maria",
      lastname: "Santos",
      category: "Corn",
    },
  ];

  const transactions: Transactions = {
    F001: [
      { date: today, details: "Bought 5kg rice seeds" },
      { date: today, details: "Attended training" },
    ],
    F002: [{ date: today, details: "Collected fertilizer subsidy" }],
  };

  const filteredFarmers = farmers.filter((f) =>
    `${f.firstname} ${f.lastname}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <Input
          placeholder="Search farmer name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:max-w-sm"
        />

        {/* Calendar Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full md:w-[220px] justify-start text-left font-normal"
            >
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Farmer Table - responsive scroll */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Number</TableHead>
              <TableHead>Firstname</TableHead>
              <TableHead>Lastname</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFarmers.map((farmer) => (
              <TableRow key={farmer.id_number}>
                <TableCell>{farmer.id_number}</TableCell>
                <TableCell>{farmer.firstname}</TableCell>
                <TableCell>{farmer.lastname}</TableCell>
                <TableCell>{farmer.category}</TableCell>
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedFarmer(farmer);
                      setOpenDialog(true);
                    }}
                  >
                    View Transaction
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Transaction Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Transactions for {selectedFarmer?.firstname}{" "}
              {selectedFarmer?.lastname}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedFarmer &&
              transactions[selectedFarmer.id_number]
                ?.filter(
                  (t) =>
                    selectedDate &&
                    format(t.date, "yyyy-MM-dd") ===
                      format(selectedDate, "yyyy-MM-dd")
                )
                .map((t, idx) => (
                  <div
                    key={idx}
                    className="rounded-md border p-2 bg-gray-50 text-sm"
                  >
                    {format(t.date, "PPP")}: {t.details}
                  </div>
                ))}

            {selectedFarmer &&
              transactions[selectedFarmer.id_number]?.filter(
                (t) =>
                  selectedDate &&
                  format(t.date, "yyyy-MM-dd") ===
                    format(selectedDate, "yyyy-MM-dd")
              ).length === 0 && (
                <p className="text-gray-500 text-sm">
                  No transactions on this date.
                </p>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FarmerAttendance;
