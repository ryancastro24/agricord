import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import supabase from "@/db/config"; // 👈 make sure this points to your supabase client

const DeleteFarmerDataDialog = ({
  openDeleteFarmerDialog,
  setOpenDeleteFarmerDialog,
  deleteFarmer,
  onSuccess,
}: any) => {
  // 🔧 function to delete farmer
  const handleDeleteFarmer = async () => {
    if (!deleteFarmer?.id) return;

    const { error } = await supabase
      .from("farmers")
      .delete()
      .eq("id", deleteFarmer.id);

    if (error) {
      console.error("Error deleting farmer:", error.message);
      alert("Failed to delete farmer ❌");
    } else {
      toast.success("Farmer deleted successfully ✅");
      onSuccess?.();

      setOpenDeleteFarmerDialog(false); // close the dialog
    }
  };

  return (
    <div>
      <Dialog
        open={openDeleteFarmerDialog}
        onOpenChange={setOpenDeleteFarmerDialog}
      >
        <DialogContent className="w-[400px] p-4">
          <DialogDescription>
            Are you sure you want to delete this farmer&apos;s data? This action
            cannot be undone.
          </DialogDescription>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenDeleteFarmerDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteFarmer}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeleteFarmerDataDialog;
