import { useEffect, useState } from "react";
import supabase from "@/db/config";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";

const Transactions = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 🧩 Fetch data
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          id,
          created_at,
          quantity,
          farmers:farmer_id ( firstname, lastname ),
          staff:staff_id ( firstname, lastname ),
          items:item_id ( name )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error.message);
      } else {
        setTransactions(data || []);
        setFilteredTransactions(data || []);
      }

      setLoading(false);
    };

    fetchTransactions();
  }, []);

  // 🧠 Filter by search and date
  useEffect(() => {
    let results = [...transactions];

    // 🔍 Search by farmer, staff, or item
    if (searchTerm.trim() !== "") {
      const lower = searchTerm.toLowerCase();
      results = results.filter(
        (t) =>
          `${t.farmers?.firstname || ""} ${t.farmers?.lastname || ""}`
            .toLowerCase()
            .includes(lower) ||
          `${t.staff?.firstname || ""} ${t.staff?.lastname || ""}`
            .toLowerCase()
            .includes(lower) ||
          t.items?.name?.toLowerCase().includes(lower)
      );
    }

    // 📅 Filter by date acquired
    if (selectedDate) {
      const target = format(selectedDate, "yyyy-MM-dd");
      results = results.filter((t) => t.created_at.startsWith(target));
    }

    setFilteredTransactions(results);
  }, [searchTerm, selectedDate, transactions]);

  // 🗑️ Clear date
  const clearDate = () => setSelectedDate(null);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Transactions</h1>

      {/* 🔍 Search + Date Filter Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <Input
          placeholder="Search by farmer, staff, or item..."
          className="w-full md:w-1/2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Filter by date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate || undefined}
                onSelect={(date) => setSelectedDate(date || null)}
              />
            </PopoverContent>
          </Popover>

          {selectedDate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearDate}
              title="Clear date filter"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 🧾 Transactions Table */}
      {loading ? (
        <p className="text-gray-600 mt-4">Loading transactions...</p>
      ) : filteredTransactions.length === 0 ? (
        <p className="text-gray-500 mt-4">No transactions found.</p>
      ) : (
        <div className="border rounded-lg shadow-sm overflow-x-auto mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Farmer</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Date Acquired</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    {t.farmers
                      ? `${t.farmers.firstname} ${t.farmers.lastname}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {t.staff ? `${t.staff.firstname} ${t.staff.lastname}` : "—"}
                  </TableCell>
                  <TableCell>{t.items?.name || "—"}</TableCell>
                  <TableCell>{t.quantity}</TableCell>
                  <TableCell>
                    {new Date(t.created_at).toLocaleString("en-PH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Transactions;
