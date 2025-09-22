import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import supabase from "@/db/config"; // 👈 make sure this points to your supabase client

const DeleteItemDialog = ({
  openDeleteItemDialog,
  setOpenDeleteItemDialog,
  deleteItem,
}: any) => {
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
      alert("Item deleted successfully ✅");
      setOpenDeleteItemDialog(false); // close the dialog
    }
  };

  return (
    <div>
      <Dialog
        open={openDeleteItemDialog}
        onOpenChange={setOpenDeleteItemDialog}
      >
        <DialogContent className="w-max-lg p-4">
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
              onClick={handleDeleteItem}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeleteItemDialog;
