export const downloadBlob = (blob: Blob, fileName?: string) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement("a");
  link.href = url;
  const filename = fileName || `${Date.now()}.xlsx`;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
};
