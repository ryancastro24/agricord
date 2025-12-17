import { useEffect, useState } from "react";
import supabase from "@/db/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

/* ---------------- TYPES ---------------- */

interface Item {
  id: number;
  name: string;
  description?: string;
  type?: string;
  quantity?: number;
}

interface ItemRequest {
  id: number;
  created_at: string;
  user_id: string;
  requested_items: Item[];
  is_approved: string | null;
  users: {
    firstname: string;
    lastname: string;
  };
}

/* ---------------- COMPONENT ---------------- */

const AdminItemRequestApprovals = () => {
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null); // <-- added

  useEffect(() => {
    fetchRequests();
  }, []);

  /* ---------------- FETCH REQUESTS ---------------- */

  const fetchRequests = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("item_requests")
      .select(
        `
        id,
        created_at,
        requested_items,
        is_approved,
        user_id,
        users (
          firstname,
          lastname
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setRequests(data as any);
    }

    setLoading(false);
  };

  /* ---------------- ACTIONS ---------------- */

  const updateStatus = async (id: number, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("item_requests")
      .update({ is_approved: status })
      .eq("id", id);

    if (!error) {
      fetchRequests();
    }
  };

  /* ---------------- STATUS BADGE ---------------- */

  const getStatusBadge = (status: string | null) => {
    if (status === "approved") {
      return <Badge className="bg-green-600">Approved</Badge>;
    }

    if (status === "rejected") {
      return <Badge variant="destructive">Rejected</Badge>;
    }

    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">
          Admin · Item Request Approvals
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>
                  {new Date(req.created_at).toLocaleString()}
                </TableCell>

                <TableCell>
                  {req.users?.firstname} {req.users?.lastname}
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExpandedRow(expandedRow === req.id ? null : req.id)
                      }
                    >
                      {expandedRow === req.id
                        ? "Hide Items"
                        : `View Items (${req.requested_items.length})`}
                    </Button>

                    {expandedRow === req.id && (
                      <div className="mt-1 flex flex-col gap-1">
                        {req.requested_items.map((item) => (
                          <Badge
                            key={item.id}
                            variant="secondary"
                            className="flex justify-between w-full"
                          >
                            <span>{item.name}</span>
                            <span className="font-semibold">
                              Qty: {item.quantity ?? 1}
                            </span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>{getStatusBadge(req.is_approved)}</TableCell>

                <TableCell className="text-right">
                  {req.is_approved === "pending" && (
                    <div className="flex justify-end gap-2 flex-wrap">
                      {/* APPROVE */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" className="bg-green-600">
                            Approve
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Approve this request?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              The requested items will be marked as approved.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-green-600"
                              onClick={() => updateStatus(req.id, "approved")}
                            >
                              Yes, Approve
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      {/* REJECT */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            Reject
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Reject this request?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              The request will be permanently marked as
                              rejected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground"
                              onClick={() => updateStatus(req.id, "rejected")}
                            >
                              Yes, Reject
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {!loading && requests.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No item requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminItemRequestApprovals;
