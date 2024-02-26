import ExcelJS from "exceljs";
import { APILogger } from "./logger";

const base64Image =
  "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";
export const generateXLS = <T>(
  title: string,
  columns: { header: string; key: keyof T; width?: number }[],
  rows: T[],
) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title, {
      pageSetup: { paperSize: 9, orientation: "landscape" },
    });

    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "left" };
    worksheet.getRow(2).values = columns.map((c) => c.header);
    worksheet.getRow(2).font = { bold: true };

    worksheet.columns = columns.map((c) => ({ ...c, key: String(c.key) }));

    // Loop over the grouped data
    rows.forEach((row) => {
      worksheet.addRow(row as any);
    });

    worksheet.getRow(1).values = [];
    const image = workbook.addImage({
      base64: base64Image,
      extension: "png",
    });
    worksheet.addImage(image, {
      tl: { col: 0, row: 0 },
      ext: { width: 96, height: 96 },
    });
    worksheet.getRow(1).height = 72;

    // worksheet.getCell("A1").value = image;

    // // Define the border style
    // const borderStyle = {
    //   style: "thin", // You can use 'thin', 'medium', 'thick', or other valid styles
    //   color: { argb: "00000000" },
    // };

    // // Loop through all cells and apply the border style
    // worksheet.eachRow((row, rowNumber) => {
    //   row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    //     cell.border = {
    //       top: borderStyle,
    //       bottom: borderStyle,
    //     };
    //   });
    // });

    // Generate the XLS file
    return workbook.xlsx.writeBuffer();
  } catch (err: any) {
    APILogger.error(err?.message, err);
    return err;
  }
};
