import { ReactNode, useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmActionProps {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  testId?: string;
}

export function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  variant = "default",
  onConfirm,
  testId,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (pending) return;
    setOpen(next);
    if (!next) setError(null);
  };

  const handleConfirm = async () => {
    setError(null);
    try {
      setPending(true);
      await onConfirm();
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Aktion fehlgeschlagen. Bitte erneut versuchen.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent data-testid={testId ? `confirm-${testId}` : undefined}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            data-testid={testId ? `confirm-${testId}-error` : "confirm-error"}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={pending}
            data-testid={testId ? `confirm-${testId}-cancel` : "confirm-cancel"}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={pending}
            className={cn(
              variant === "destructive" &&
                buttonVariants({ variant: "destructive" }),
            )}
            data-testid={testId ? `confirm-${testId}-ok` : "confirm-ok"}
          >
            {pending ? "..." : error ? "Erneut versuchen" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
