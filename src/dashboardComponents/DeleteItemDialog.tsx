import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import supabase from "@/db/config"; // 👈 make sure this points to your supabase client
import { useState } from "react";

const DeleteItemDialog = ({
  openDeleteItemDialog,
  setOpenDeleteItemDialog,
  deleteItem,
  onSuccess,
}: any) => {
  const [loading, setLoading] = useState(false);
  // 🔧 function to delete item
  const handleDeleteItem = async () => {
    if (!deleteItem?.id) return;

    const { error } = await supabase
      .from("items") // 👈 your items table
      .delete()
      .eq("id", deleteItem.id);

    if (error) {
      console.error("Error deleting item:", error.message);
      alert("Failed to delete item ❌");
    } else {
      toast.success("Item Deleted successfully!");
      setLoading(false);
      onSuccess?.(); // refresh parent data
      setOpenDeleteItemDialog(false); // close the dialog
    }
  };

  return (
    <div>
      <Dialog
        open={openDeleteItemDialog}
        onOpenChange={setOpenDeleteItemDialog}
      >
        <DialogContent className="w-[400px] p-4">
          <DialogDescription>
            Are you sure you want to delete this item? This action cannot be
            undone.
          </DialogDescription>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenDeleteItemDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                handleDeleteItem();
                setLoading(true);
              }}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeleteItemDialog;
