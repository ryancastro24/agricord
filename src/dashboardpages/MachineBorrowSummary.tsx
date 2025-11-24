import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import supabase from "@/db/config";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ✅ TypeScript Interfaces
interface Farmer {
  firstname: string;
  lastname: string;
}

interface MachineryDetails {
  reference_number: string;
  type: string;
  is_available: boolean;
  status: string;
}

interface BorrowRecord {
  id: string | number;
  date_borrowed: string | null;
  date_returned: string | null;
  date_scheduled_returned: string | null;
  remarks: string | null;
  status: string | null;
  is_available: boolean | null;
  farmers?: Farmer | null;
  farming_tools?: MachineryDetails | null;
}

const MachineBorrowSummary: React.FC = () => {
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [borrowDate, setBorrowDate] = useState<string>("");
  const [scheduledReturnDate, setScheduledReturnDate] = useState<string>("");
  const [actualReturnDate, setActualReturnDate] = useState<string>("");

  useEffect(() => {
    fetchBorrowedMachines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, borrowDate, scheduledReturnDate, actualReturnDate]);

  const fetchBorrowedMachines = async (): Promise<void> => {
    let query = supabase.from("borrow_farming_tools").select(
      `
        id,
        date_borrowed,
        date_returned,
        date_scheduled_returned,
        remarks,
        
        farmers (
          firstname,
          lastname
        ),
        farming_tools (
          reference_number,
          type,
          status,
          is_available
        )
        `
    );

    if (searchTerm) {
      query = query.or(
        `farmers.lastname.ilike.%${searchTerm}%,farming_tools.reference_number.ilike.%${searchTerm}%`
      );
    }

    if (borrowDate) query = query.eq("date_borrowed", borrowDate);
    if (scheduledReturnDate)
      query = query.eq("date_scheduled_returned", scheduledReturnDate);
    if (actualReturnDate) query = query.eq("date_returned", actualReturnDate);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching borrow records:", error);
    } else {
      setRecords((data as any) || []);
    }
  };

  // ✅ Convert Records to Excel and Trigger Download
  const exportToExcel = () => {
    const excelData = records.map((item) => ({
      Reference_Number: item.farming_tools?.reference_number || "N/A",
      Machine_Type: item.farming_tools?.type || "N/A",
      Farmer_Name: item.farmers
        ? `${item.farmers.firstname} ${item.farmers.lastname}`
        : "Unknown",
      Date_Borrowed: item.date_borrowed || "N/A",
      Scheduled_Return: item.date_scheduled_returned || "N/A",
      Date_Returned: item.date_returned || "Processing",
      Remarks: item.remarks || "None",
      Status: item.farming_tools?.status || "Unknown",
      Availability: item.farming_tools?.is_available
        ? "Available"
        : item.farming_tools?.is_available === false
        ? "Not Available"
        : "Unknown",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Borrowed Machines");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(file, "machine_borrow_summary.xlsx");
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Machine Borrow Summary</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label>Search Farmer</Label>
          <Input
            type="text"
            placeholder="Enter farmer name or reference number"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
          />
        </div>
        <div>
          <Label>Borrow Date</Label>
          <Input
            type="date"
            value={borrowDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setBorrowDate(e.target.value)
            }
          />
        </div>
        <div>
          <Label>Scheduled Return Date</Label>
          <Input
            type="date"
            value={scheduledReturnDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setScheduledReturnDate(e.target.value)
            }
          />
        </div>
        <div>
          <Label>Actual Return Date</Label>
          <Input
            type="date"
            value={actualReturnDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setActualReturnDate(e.target.value)
            }
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={fetchBorrowedMachines}>Search</Button>
        {/* ✅ Excel Button */}
        <Button onClick={exportToExcel} variant="secondary">
          Download Excel
        </Button>
      </div>

      {/* Table */}
      <div className="mt-6 border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference Number</TableHead>
              <TableHead>Machine Type</TableHead>
              <TableHead>Farmer Name</TableHead>
              <TableHead>Date Borrowed</TableHead>
              <TableHead>Scheduled Return</TableHead>
              <TableHead>Date Returned</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length > 0 ? (
              records.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.farming_tools?.reference_number || "N/A"}
                  </TableCell>
                  <TableCell>{item.farming_tools?.type || "N/A"}</TableCell>
                  <TableCell>
                    {item.farmers
                      ? `${item.farmers.firstname} ${item.farmers.lastname}`
                      : "Unknown"}
                  </TableCell>
                  <TableCell>{item.date_borrowed || "N/A"}</TableCell>
                  <TableCell>{item.date_scheduled_returned || "N/A"}</TableCell>
                  <TableCell>
                    {item.date_returned ? (
                      item.date_returned
                    ) : (
                      <span className="text-yellow-600">Processing</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          More
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Borrow Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 mt-2">
                          <p>
                            <strong>Remarks:</strong>{" "}
                            {item.remarks ? item.remarks : "No remarks"}
                          </p>
                          <p>
                            <strong>Available:</strong>{" "}
                            {item.farming_tools?.is_available
                              ? "✅ Yes"
                              : item.farming_tools?.is_available === false
                              ? "❌ No"
                              : "Unknown"}
                          </p>
                          <p>
                            <strong>Status:</strong>{" "}
                            {item.farming_tools?.status ||
                              "No status available"}
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MachineBorrowSummary;
