import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

type Farmer = {
  id: string;
  id_number: string;
  firstname: string;
  middlename?: string;
  lastname: string;
  suffix?: string;
  barangay: string;
  city: string;
  province: string;
  contact_number: string;
  sex: string;
  date_of_birth?: string;
  civil_status?: string;
  religion?: string;
  highest_formal_education?: string;
  farmer_role?: string;
  farming_type?: string;
  farm_size?: string;
  main_crop?: string;
  years_of_experience?: string;
  profile_picture?: string;
  government_id_image?: string;
  government_id_number?: string;
};

interface ViewFarmersDetailsProps {
  openViewFarmerDialog: boolean;
  setOpenViewFarmerDialog: (open: boolean) => void;
  details: Farmer;
}

const ViewFarmersDetails = ({
  openViewFarmerDialog,
  setOpenViewFarmerDialog,
  details,
}: ViewFarmersDetailsProps) => {
  if (!details) return null;

  // Calculate age dynamically
  const computeAge = (dob?: string) => {
    if (!dob) return "—";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  return (
    <Dialog open={openViewFarmerDialog} onOpenChange={setOpenViewFarmerDialog}>
      <DialogContent className="max-w-5xl h-[80vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Farmer Profile
          </DialogTitle>
          <DialogDescription>
            Complete personal and work information
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6 mt-4">
          {/* LEFT COLUMN - Profile + ID */}
          <div className="w-full md:w-1/3 bg-gray-50 border rounded-lg p-4 flex flex-col items-center justify-between">
            <div className="flex flex-col items-center gap-2">
              <img
                src={details.profile_picture || "/placeholder.jpg"}
                alt="Profile"
                className="w-60 h-60 object-cover rounded-full border shadow-sm"
              />
              <p className="text-sm text-gray-600 mt-2 font-medium">
                {details.firstname} {details.lastname}
              </p>
            </div>

            <div className="mt-5 w-full flex flex-col items-center">
              <img
                src={details.government_id_image || "/placeholder_id.jpg"}
                alt="Government ID"
                className="w-60 h-36 object-cover border rounded-lg shadow-sm"
              />
              <p className="text-sm text-gray-600 mt-1">
                <strong>ID Number:</strong>{" "}
                {details.government_id_number || "—"}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN - Details */}
          <div className="w-full md:w-2/3 space-y-6">
            {/* Profile Information */}
            <div>
              <h3 className="font-semibold text-base mb-2">
                👤 Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Full Name">
                  {details.firstname} {details.middlename ?? ""}{" "}
                  {details.lastname} {details.suffix ?? ""}
                </Info>
                <Info label="ID Number">{details.id_number}</Info>
                <Info label="Gender">{details.sex}</Info>
                <Info label="Birthdate">{details.date_of_birth || "—"}</Info>
                <Info label="Age">{computeAge(details.date_of_birth)}</Info>
                <Info label="Civil Status">{details.civil_status || "—"}</Info>
                <Info label="Religion">{details.religion || "—"}</Info>
                <Info label="Education">
                  {details.highest_formal_education || "—"}
                </Info>
              </div>
            </div>

            <Separator />

            {/* Contact Info */}
            <div>
              <h3 className="font-semibold text-base mb-2">📞 Contact Info</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Contact Number">{details.contact_number}</Info>
                <Info label="Barangay">{details.barangay}</Info>
                <Info label="City">{details.city}</Info>
                <Info label="Province">{details.province}</Info>
              </div>
            </div>

            <Separator />

            {/* Work Info */}
            <div>
              <h3 className="font-semibold text-base mb-2">🌾 Work Info</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Info label="Farmer Role">{details.farmer_role || "—"}</Info>
                <Info label="Farming Type">{details.farming_type || "—"}</Info>
                <Info label="Farm Size">{details.farm_size || "—"}</Info>
                <Info label="Main Crop">{details.main_crop || "—"}</Info>
                <Info label="Experience">
                  {details.years_of_experience || "—"}
                </Info>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Small reusable component for cleaner markup
const Info = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <p className="font-medium text-gray-700">{label}</p>
    <p className="bg-gray-50 border rounded-md px-2 py-1 mt-1">{children}</p>
  </div>
);

export default ViewFarmersDetails;
