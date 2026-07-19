import { FolderUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DriveFolderLink({ driveUrl, label = "Google Drive" }: { driveUrl?: string | null, label?: string }) {
  if (!driveUrl) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2 mt-2 border-blue-500/30 text-blue-600 hover:bg-blue-500/10"
      onClick={() => window.open(driveUrl, "_blank", "noopener,noreferrer")}
    >
      <FolderUp className="w-4 h-4" />
      {label}
    </Button>
  );
}
