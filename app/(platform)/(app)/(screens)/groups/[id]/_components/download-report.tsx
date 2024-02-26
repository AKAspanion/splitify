"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { downloadBlob } from "@/utils/dom";

export const DownloadReport = ({ groupId }: { groupId: string }) => {
  const [loading, setLoading] = useState(false);

  const downloadExcel = async () => {
    try {
      setLoading(true);
      const resp = await fetch("/api/generate/excel/expense", {
        method: "POST",
        headers: { "Content-Type": "blob" },
        body: JSON.stringify({ groupId }),
      });

      const blob = await resp.blob();
      const fileName = resp.headers
        ?.get("content-disposition")
        ?.split("filename=")[1];

      downloadBlob(blob, fileName);

      toast.success("Excel report downloaded successfully");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to downloaded excel report");
    }
  };

  const downloadCSV = () => {
    //
  };

  const downloadText = async () => {
    try {
      setLoading(true);
      const resp = await fetch("/api/generate/text/expense", {
        method: "POST",
        headers: { "Content-Type": "blob" },
        body: JSON.stringify({ groupId }),
      });

      const blob = await resp.blob();
      const fileName = resp.headers
        ?.get("content-disposition")
        ?.split("filename=")[1];

      downloadBlob(blob, fileName);

      toast.success("Text Report downloaded successfully");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to downloaded text report");
    }
  };

  const handleDownload = async (type: string) => {
    switch (type) {
      case "excel":
        await downloadExcel();
        break;
      case "csv":
        await downloadCSV();
        break;
      case "text":
        await downloadText();
        break;

      default:
        break;
    }
  };

  return (
    <div className="flex w-10 h-10 items-center justify-center">
      {loading ? (
        <Spinner />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <DownloadIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleDownload("excel")}>
              Excel
            </DropdownMenuItem>
            {/* <DropdownMenuItem disabled onClick={() => handleDownload("csv")}>
              CSV
            </DropdownMenuItem> */}
            <DropdownMenuItem onClick={() => handleDownload("text")}>
              Text
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
