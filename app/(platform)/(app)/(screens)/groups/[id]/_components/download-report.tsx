"use client";

import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const DownloadReport = () => {
  const [loading, setLoading] = useState(false);

  const download = async () => {
    try {
      setLoading(true);
      const resp = await fetch("/api/generate/group-report", {
        method: "POST",
        headers: { "Content-Type": "blob" },
        body: JSON.stringify({
          groupId: "xzzaWW_GWyVezyW2s82Ml",
        }),
      });

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      const filename =
        resp.headers?.get("content-disposition")?.split("filename=")[1] ||
        `${Date.now()}.xls`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      setLoading(false);
      toast.success("Report downloaded successfully");
    } catch (error) {
      setLoading(false);
      toast.error("Failed to downloaded report");
    }
  };
  const handleDownload = () => {
    download();
  };

  return (
    <div className="flex w-10 h-10 items-center justify-center">
      {loading ? (
        <Spinner />
      ) : (
        <Button variant="ghost" size="icon" onClick={handleDownload}>
          <DownloadIcon />
        </Button>
      )}
    </div>
  );
};
