const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 10;

export async function createPdfFromImage(
  imageDataUrl: string,
  fileName: string,
  title: string,
) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const image = pdf.getImageProperties(imageDataUrl);
  const scale = Math.min(
    (A4_WIDTH_MM - PAGE_MARGIN_MM * 2) / image.width,
    (A4_HEIGHT_MM - PAGE_MARGIN_MM * 2) / image.height,
  );
  const width = image.width * scale;
  const height = image.height * scale;

  pdf.setProperties({ title, author: "Evol Jewels" });
  pdf.addImage(
    imageDataUrl,
    "PNG",
    (A4_WIDTH_MM - width) / 2,
    PAGE_MARGIN_MM,
    width,
    height,
    undefined,
    "FAST",
  );

  return new File([pdf.output("blob")], fileName, { type: "application/pdf" });
}
