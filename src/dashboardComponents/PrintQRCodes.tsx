"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";

import { IoLocationOutline } from "react-icons/io5";
import { FiPhone } from "react-icons/fi";
import { HiOutlineMail } from "react-icons/hi";
import logo from "../assets/logo.png";
import idBg from "../assets/idbg.jpg";

import { useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { HiOutlinePrinter } from "react-icons/hi2";

const PrintQRCodes = ({ farmers }: any) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [search, setSearch] = useState("");

  const filteredFarmers = useMemo(() => {
    return farmers.filter(
      (f: any) =>
        f.firstname.toLowerCase().includes(search.toLowerCase()) ||
        f.lastname.toLowerCase().includes(search.toLowerCase())
    );
  }, [farmers, search]);

  const toBase64 = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return ""; // fallback if image cannot be loaded
    }
  };

  const handlePrint = async () => {
    const farmersToPrint = farmers.filter((f: any) =>
      selectedFarmers.includes(f.id)
    );
    if (!farmersToPrint || farmersToPrint.length === 0) return;

    const idBgBase64 = await toBase64(idBg);
    const logoBase64 = await toBase64(logo);

    const cardsHtml = await Promise.all(
      farmersToPrint.map(async (farmer: any) => {
        const profileBase64 = await toBase64(farmer.profile_picture);
        const qrBase64 = await toBase64(farmer.qrcode);

        return `
        <!-- FRONT -->
        <div class="card break-avoid relative">
          <img src="${idBgBase64}" class="bg-img" alt="Card Background" />
          <div class="content">
            <div >
              <img class="photo" src="${profileBase64}" alt="${
          farmer.firstname
        } ${farmer.lastname} Profile" class="w-full h-full"/>
            </div>
            <p class="name">${farmer.firstname.toUpperCase()} ${farmer.lastname.toUpperCase()}</p>
              <span  class="role_name">FARMER</span>  
            </div>
        </div>

        <!-- BACK -->
        <div class="card break-avoid relative">
          <img src="${idBgBase64}" class="bg-img" alt="Card Background" />
          <img src="${logoBase64}" class="logo-overlay" alt="Logo" />
          <div class="content">
            <div class="qr-block">
              <img src="${qrBase64}" alt="${farmer.firstname} ${
          farmer.lastname
        } QR" class="qr"/>
              <span style={{color: white}} class="idnum">${
                farmer.id_number
              }</span>
            </div>
            <p style={{color: white}} class="address">${farmer.purok}, ${
          farmer.barangay
        }, ${farmer.city}, ${farmer.province}</p>
            <p style={{color: white}} class="contact">${
              farmer.contact_number
            }</p>
            <p style={{color: white}} class="email">${farmer.email || ""}</p>
          </div>
        </div>
      `;
      })
    );

    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Print ID Cards</title>
          <style>
            @page { size: 8.5in 13in landscape; margin: 10px; }
            body { margin:0; padding:0; font-family:Arial,sans-serif; background:white; }
            .grid { display:flex; flex-wrap:wrap; justify-content:space-evenly; gap:10px; padding:10px; }
            .card { position:relative; width:204px; height:324px; border:1px solid #000; border-radius:8px; overflow:hidden; display:flex; align-items:center; justify-content:center; text-align:center; background:white; }
            .bg-img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; }
            .logo-overlay { position:absolute; bottom:4px; right:4px; width:40px; opacity:0.6; }
            .content { position:relative; z-index:1; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:6px; }
            .photo { width:96px; height:96px; border:1px solid #666; background:#f1f1f1; margin-bottom:6px; display:flex; align-items:center; justify-content:center; }
            .name { font-size:16px; font-weight:bold; margin-top:10px; }
             .role_name { font-size:12px; margin:0; }
            .qr-block { display:flex; flex-direction:column; align-items:center; margin-bottom:6px; }
            .qr { width:70px; height:70px; border:1px solid #ddd; background:white; margin-bottom:4px; }
            .idnum { font-size:10px; font-weight:bold; }
            .address, .contact, .email { font-size:10px; margin:2px 0; }
            .break-avoid { break-inside:avoid; page-break-inside:avoid; }
          </style>
        </head>
        <body>
          <div class="grid">${cardsHtml.join("")}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedFarmers([]);
      setSelectAll(false);
    } else {
      setSelectedFarmers(filteredFarmers.map((f: any) => f.id));
      setSelectAll(true);
    }
  };

  const toggleFarmer = (id: string) => {
    if (selectedFarmers.includes(id)) {
      setSelectedFarmers(selectedFarmers.filter((fId) => fId !== id));
      setSelectAll(false);
    } else {
      setSelectedFarmers([...selectedFarmers, id]);
      if (selectedFarmers.length + 1 === filteredFarmers.length)
        setSelectAll(true);
    }
  };

  return (
    <div className="wfull flex flex-col gap-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="icon"
            variant="secondary"
            className="flex items-center gap-2 cursor-pointer"
          >
            <HiOutlinePrinter />
          </Button>
        </DialogTrigger>

        <DialogContent className="w-full h-full p-6">
          <DialogTitle className="mb-2 print:hidden">
            Print ID Cards
          </DialogTitle>
          <DialogDescription className="mb-4 print:hidden">
            Search and select the farmers you want to print ID cards for.
          </DialogDescription>

          {/* SEARCH BAR */}
          <input
            type="text"
            placeholder="Search farmer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-2 py-1 mb-4 w-full"
          />

          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={toggleSelectAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="font-medium">
              Select All
            </label>
          </div>

          <div
            ref={printRef}
            className="flex flex-wrap gap-5 overflow-y-auto print:gap-2 max-h-[60vh]"
          >
            {filteredFarmers?.length > 0 ? (
              filteredFarmers.map((farmer: any) => (
                <div key={farmer.id} className="flex flex-col items-center">
                  <input
                    type="checkbox"
                    checked={selectedFarmers.includes(farmer.id)}
                    onChange={() => toggleFarmer(farmer.id)}
                    className="mb-2"
                  />
                  {/* FRONT PREVIEW */}
                  <div
                    className="border rounded-lg shadow-md flex flex-col items-center justify-center text-center bg-white"
                    style={{
                      width: "2.125in",
                      height: "3.375in",
                      backgroundImage: `url(${idBg})`,
                      backgroundSize: "cover",
                      marginBottom: "8px",
                    }}
                  >
                    <div className="w-40 h-40 border rounded bg-gray-100 mb-2 flex items-center justify-center">
                      <img
                        src={farmer.profile_picture}
                        className="w-full h-full"
                        alt="farmer-profile"
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="font-bold text-white">
                        {farmer.firstname.toUpperCase()}{" "}
                        {farmer.lastname.toUpperCase()}
                      </p>
                      <span className="text-sm font-light text-white">
                        FARMER
                      </span>
                    </div>
                  </div>

                  {/* BACK PREVIEW */}
                  <div
                    className="border rounded-lg shadow-md flex flex-col items-center justify-center bg-white"
                    style={{
                      width: "2.125in",
                      height: "3.375in",
                      backgroundImage: `url(${idBg})`,
                      backgroundSize: "cover",
                    }}
                  >
                    <img
                      src={farmer.qrcode}
                      alt={`${farmer.firstname} ${farmer.lastname} QR`}
                      className="w-24 h-24 border p-1 rounded bg-white mb-1"
                    />
                    <p className="text-[12px] text-white font-bold mb-1">
                      {farmer.id_number}
                    </p>
                    <div className="w-full flex items-center flex-col px-4">
                      <span className="flex gap-1 text-[12px] text-white">
                        <IoLocationOutline /> {farmer.purok}, {farmer.barangay}{" "}
                        {farmer.city},{farmer.province}
                      </span>
                      <span className="flex gap-1 items-center text-[12px] text-white">
                        <FiPhone /> {farmer.contact_number}
                      </span>
                      <span className="flex gap-1 items-center text-[12px] text-white">
                        <HiOutlineMail /> {farmer.email}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No farmers found.</p>
            )}
          </div>

          <div className="mt-6 flex justify-end print:hidden">
            <Button
              onClick={handlePrint}
              disabled={selectedFarmers.length === 0}
            >
              Print Selected
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrintQRCodes;
