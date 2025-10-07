import { useEffect } from "react";
import { useParams } from "react-router-dom";
import supabase from "@/db/config";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export default function GenerateItemPDF() {
  const { id } = useParams();

  useEffect(() => {
    const generatePDF = async () => {
      const { data: item, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !item) {
        console.error("Failed to fetch item:", error);
        return;
      }

      // 📄 A4 Landscape
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 210mm

      // Base layout (40 cards = 8×5 grid)
      const cols = 8;
      const rows = 5;
      const baseCardSize = 35; // base size before scaling
      const baseSpacing = 3;
      const baseMargin = 4;
      const cornerRadius = 3;

      // Calculate total required width/height for base layout
      const baseWidth =
        baseMargin * 2 + cols * baseCardSize + (cols - 1) * baseSpacing;
      const baseHeight =
        baseMargin * 2 + rows * baseCardSize + (rows - 1) * baseSpacing;

      // 🔍 Compute scaling factor to perfectly fit A4
      const scaleX = pageWidth / baseWidth;
      const scaleY = pageHeight / baseHeight;
      const scale = Math.min(scaleX, scaleY); // preserve aspect ratio

      // Apply scaling
      const cardSize = baseCardSize * scale;
      const spacing = baseSpacing * scale;
      const margin = baseMargin * scale;

      // 🧩 Generate QR code
      const qrDataUrl = await QRCode.toDataURL(item.barcode || item.id, {
        width: 256,
        margin: 0,
      });

      let count = 0;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = margin + col * (cardSize + spacing);
          const y = margin + row * (cardSize + spacing);

          // Card border
          doc.setDrawColor(160);
          doc.roundedRect(
            x,
            y,
            cardSize,
            cardSize,
            cornerRadius,
            cornerRadius,
            "S"
          );

          // QR Code fills almost the entire card
          const qrPadding = 1 * scale;
          const qrSize = cardSize - qrPadding * 2 - 7 * scale; // space for text
          const qrX = x + (cardSize - qrSize) / 2;
          const qrY = y + qrPadding;
          doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

          // Item name
          const itemName = item.name || "Unnamed";
          const textY = qrY + qrSize + 4 * scale;
          const textMaxWidth = cardSize - 4 * scale;

          let fontSize = 7 * scale;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(fontSize);
          while (doc.getTextWidth(itemName) > textMaxWidth && fontSize > 3) {
            fontSize -= 0.3;
            doc.setFontSize(fontSize);
          }

          const textX = x + cardSize / 2;
          doc.text(itemName, textX, textY, { align: "center" });

          count++;
        }
      }

      console.log(`✅ Generated ${count} cards (auto-scaled to fit A4)`);
      doc.save(`${item.name || "item"}_qrcards.pdf`);
    };

    generatePDF();
  }, [id]);

  return (
    <div className="p-6 text-center text-gray-600">
      Generating scaled QR card sheet... Please wait.
    </div>
  );
}
