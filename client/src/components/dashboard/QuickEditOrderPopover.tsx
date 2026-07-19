import { useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Save, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WorkshopOrder, User } from "@shared/schema";

interface QuickEditOrderPopoverProps {
  order: WorkshopOrder;
  partners: User[];
  children: ReactNode;
}

const NONE = "__none__";

function toDateInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function QuickEditOrderPopover({
  order,
  partners,
  children,
}: QuickEditOrderPopoverProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const meta = (order.repairProtocolJson as any) || {};
  const initialPriority: "low" | "normal" | "high" | "urgent" = [
    "low",
    "normal",
    "high",
    "urgent",
  ].includes(meta?.priority)
    ? meta.priority
    : "normal";
  const initialNote: string =
    typeof meta?.internalNote === "string" ? meta.internalNote : "";

  const [partnerId, setPartnerId] = useState<string>(
    order.partnerId ?? NONE,
  );
  const [scheduledDate, setScheduledDate] = useState<string>(
    toDateInput(order.scheduledDate as any),
  );
  const [internalNote, setInternalNote] = useState<string>(initialNote);
  const [priority, setPriority] = useState<
    "low" | "normal" | "high" | "urgent"
  >(initialPriority);
  const [grossEur, setGrossEur] = useState<string>(
    order.totalAmountCents > 0
      ? (order.totalAmountCents / 100).toFixed(2)
      : "",
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const existingProtocol =
        (order.repairProtocolJson as any) &&
        typeof order.repairProtocolJson === "object"
          ? (order.repairProtocolJson as any)
          : {};
      const payload: Record<string, any> = {
        partnerId: partnerId === NONE ? null : partnerId,
        scheduledDate: scheduledDate
          ? new Date(scheduledDate).toISOString()
          : null,
        repairProtocolJson: {
          ...existingProtocol,
          internalNote,
          priority,
        },
      };
      if (grossEur !== "" && !isNaN(parseFloat(grossEur))) {
        payload.totalAmountCents = Math.round(parseFloat(grossEur) * 100);
      }
      const res = await apiRequest(
        "PATCH",
        `/api/admin/workshop-orders/${order.id}`,
        payload,
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/workshop-orders"],
      });
      toast({ title: "Auftrag aktualisiert" });
      setOpen(false);
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Speichern fehlgeschlagen",
        description: "Bitte erneut versuchen.",
      });
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-3 space-y-3"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        data-testid={`quick-edit-${order.id}`}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Schnellbearbeitung</div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setOpen(false)}
            data-testid="quick-edit-close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Partner</Label>
          <Select value={partnerId} onValueChange={setPartnerId}>
            <SelectTrigger data-testid="quick-edit-partner">
              <SelectValue placeholder="Partner wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>— Kein Partner —</SelectItem>
              {partners.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Geplanter Termin</Label>
          <Input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            data-testid="quick-edit-scheduled"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Priorität</Label>
          <Select
            value={priority}
            onValueChange={(v) =>
              setPriority(v as "low" | "normal" | "high" | "urgent")
            }
          >
            <SelectTrigger data-testid="quick-edit-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Niedrig</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">Hoch</SelectItem>
              <SelectItem value="urgent">Dringend</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Brutto (EUR)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={grossEur}
            onChange={(e) => setGrossEur(e.target.value)}
            data-testid="quick-edit-gross"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Interne Notiz</Label>
          <Textarea
            rows={3}
            placeholder="Nur intern sichtbar…"
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            className="resize-none text-sm"
            data-testid="quick-edit-note"
          />
        </div>

        <Button
          type="button"
          className="w-full gap-2"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          data-testid="quick-edit-save"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Speichern…
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Speichern
            </>
          )}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
