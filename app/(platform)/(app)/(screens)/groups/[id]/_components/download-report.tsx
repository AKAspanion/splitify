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
import { callFunction } from "@/lib/functions/call";
import { downloadBlob } from "@/utils/dom";

type ReportFormat = "excel" | "csv" | "text";

const FORMATS: { format: ReportFormat; label: string }[] = [
  { format: "excel", label: "Excel" },
  { format: "csv", label: "CSV" },
  { format: "text", label: "Text" },
];

/** The file name the `reports` function put in `Content-Disposition`, the UTF-8 form first. */
const fileNameOf = (response: Response): string | undefined => {
  const header = response.headers.get("content-disposition") ?? "";
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      // Fall through to the plain name.
    }
  }
  return /filename="([^"]*)"/i.exec(header)?.[1];
};

export const DownloadReport = ({ groupId }: { groupId: string }) => {
  const [loading, setLoading] = useState(false);

  const download = async (format: ReportFormat, label: string) => {
    setLoading(true);
    try {
      const response = await callFunction("/api/reports/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, format }),
      });
      downloadBlob(await response.blob(), fileNameOf(response));
      toast.success(`${label} report downloaded successfully`);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : `Failed to download the ${label} report`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-10 h-10 items-center justify-center">
      {loading ? (
        <Spinner />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Download report">
              <DownloadIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {FORMATS.map(({ format, label }) => (
              <DropdownMenuItem
                key={format}
                onClick={() => download(format, label)}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
