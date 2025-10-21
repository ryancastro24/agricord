import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { format, isValid } from "date-fns";
import supabase from "@/db/config";

interface Farmer {
  id: string;
  id_number: string;
  firstname: string;
  lastname: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
}

interface Attendance {
  id: string | null;
  cluster_id: string | null;
  farmer_id: string | null;
  created_at: string | null;
  farmers: Farmer;
}

const FarmerAttendance = () => {
  const today = new Date();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch data from Supabase
  useEffect(() => {
    const fetchAttendances = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) return;

        const { data: cluster, error: clusterError } = await supabase
          .from("clusters")
          .select("id")
          .eq("chairman_id", user.id)
          .single();
        if (clusterError) throw clusterError;
        if (!cluster) return;

        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select(
            `
              id,
              cluster_id,
              farmer_id,
              created_at,
              farmers (
                id,
                id_number,
                firstname,
                lastname,
                street,
                barangay,
                city,
                province
              )
            `
          )
          .eq("cluster_id", cluster.id)
          .order("created_at", { ascending: false });

        if (attendanceError) throw attendanceError;
        setAttendances((attendanceData as Attendance[] | []) || []);
      } catch (err) {
        console.error("Error fetching attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendances();
  }, []);

  // ✅ Safe date filter function
  const isSameDate = (
    created_at: string | null,
    selected: Date | undefined
  ) => {
    if (!created_at || !selected) return false;
    const parsed = new Date(created_at);
    if (!isValid(parsed)) return false;
    return format(parsed, "yyyy-MM-dd") === format(selected, "yyyy-MM-dd");
  };

  // ✅ Apply search + date filters
  const filteredAttendances = attendances.filter((a) => {
    const matchesName = `${a.farmers.firstname} ${a.farmers.lastname}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesDate = isSameDate(a.created_at, selectedDate);
    return matchesName && matchesDate;
  });

  // ✅ Responsive table detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

      {/* Farmer Table */}
      <div className="overflow-x-auto rounded-lg border">
        {!isMobile ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Number</TableHead>
                <TableHead>Firstname</TableHead>
                <TableHead>Lastname</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    Loading attendance...
                  </TableCell>
                </TableRow>
              ) : filteredAttendances.length > 0 ? (
                filteredAttendances.map((a) => {
                  const parsedDate = a.created_at
                    ? new Date(a.created_at)
                    : null;
                  const validDate =
                    parsedDate && isValid(parsedDate)
                      ? format(parsedDate, "PPP")
                      : "—";

                  return (
                    <TableRow key={a.id}>
                      <TableCell>{a.farmers.id_number}</TableCell>
                      <TableCell>{a.farmers.firstname}</TableCell>
                      <TableCell>{a.farmers.lastname}</TableCell>
                      <TableCell>
                        {`${a.farmers.street}, ${a.farmers.barangay}, ${a.farmers.city}, ${a.farmers.province}`}
                      </TableCell>
                      <TableCell>{validDate}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No attendance found for this date.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col gap-3 p-2">
            {loading ? (
              <p className="text-center py-4">Loading attendance...</p>
            ) : filteredAttendances.length > 0 ? (
              filteredAttendances.map((a) => {
                const parsedDate = a.created_at ? new Date(a.created_at) : null;
                const validDate =
                  parsedDate && isValid(parsedDate)
                    ? format(parsedDate, "PPP")
                    : "—";

                return (
                  <div
                    key={a.id}
                    className="border rounded-lg p-3 bg-white shadow-sm"
                  >
                    <p className="font-semibold">
                      {a.farmers.firstname} {a.farmers.lastname}
                    </p>
                    <p className="text-sm text-gray-600">
                      ID: {a.farmers.id_number}
                    </p>
                    <p className="text-sm">
                      {a.farmers.street}, {a.farmers.barangay}, {a.farmers.city}
                      , {a.farmers.province}
                    </p>
                    <p className="text-sm mt-1 text-gray-500">{validDate}</p>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-4">
                No attendance found for this date.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerAttendance;
