"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GlassPanel } from "@/components/ui/glass-panel";
import { GradientButton } from "@/components/ui/gradient-button";

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  availableDays: string[];
  fromTime: string;
  toTime: string;
  acceptingNew: boolean;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface DoctorRosterProps {
  businessId: string;
  agentId: string;
  /** Reserved for backwards-compat — palette is now brand-fixed. */
  accentColor?: string;
}

const inputClass = "mt-1.5 h-9";

export function DoctorRoster({ businessId, agentId }: DoctorRosterProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<Doctor, "id">>({
    name: "",
    specialization: "",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    fromTime: "09:00",
    toTime: "17:00",
    acceptingNew: true,
  });

  const saveToServer = useCallback(
    async (updatedDoctors: Doctor[]) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/business/${businessId}/agents/${agentId}/data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataType: "doctors", data: { doctors: updatedDoctors } }),
        });
        if (!res.ok) throw new Error();
      } catch {
        toast.error("Failed to save doctor roster");
      } finally {
        setSaving(false);
      }
    },
    [businessId, agentId],
  );

  useEffect(() => {
    fetch(`/api/business/${businessId}/agents/${agentId}/data`)
      .then((r) => r.json())
      .then((d) => {
        const docData = d.data?.find((item: { dataType: string }) => item.dataType === "doctors");
        if (docData?.data?.doctors) setDoctors(docData.data.doctors as Doctor[]);
      })
      .catch(() => {});
  }, [businessId, agentId]);

  const addDoctor = () => {
    if (!form.name.trim()) {
      toast.error("Doctor name is required");
      return;
    }
    const newDoc: Doctor = { ...form, id: crypto.randomUUID() };
    const updated = [...doctors, newDoc];
    setDoctors(updated);
    void saveToServer(updated);
    setForm({
      name: "",
      specialization: "",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      fromTime: "09:00",
      toTime: "17:00",
      acceptingNew: true,
    });
  };

  const removeDoctor = (id: string) => {
    const updated = doctors.filter((d) => d.id !== id);
    setDoctors(updated);
    void saveToServer(updated);
  };

  const toggleDay = (day: string) => {
    setForm((f) => ({
      ...f,
      availableDays: f.availableDays.includes(day)
        ? f.availableDays.filter((d) => d !== day)
        : [...f.availableDays, day],
    }));
  };

  return (
    <GlassPanel elevation="raised" radius="lg" className="p-7 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-300/20 flex items-center justify-center">
          <Stethoscope className="w-4 h-4 text-blue-300" strokeWidth={2} />
        </div>
        <h3 className="text-base font-semibold tracking-tight text-white">Doctor roster</h3>
        <span className="text-xs text-white/40 ml-auto">{doctors.length} doctors</span>
      </div>

      {doctors.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start justify-between bg-white/[0.03] rounded-2xl px-4 py-3 border border-white/[0.06]"
            >
              <div className="min-w-0">
                <p className="text-sm text-white font-medium">Dr. {doc.name}</p>
                {doc.specialization && (
                  <p className="text-xs text-white/55">{doc.specialization}</p>
                )}
                <p className="text-xs text-white/40 mt-0.5">
                  {doc.availableDays.map((d) => d.slice(0, 3)).join(" · ")} · {doc.fromTime} – {doc.toTime}
                </p>
                <span className={`text-[11px] ${doc.acceptingNew ? "text-emerald-300/80" : "text-white/40"}`}>
                  {doc.acceptingNew ? "Accepting new patients" : "Not accepting new patients"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeDoctor(doc.id)}
                className="text-white/40 hover:text-rose-300 p-1 shrink-0 ml-2 rounded transition-colors"
                aria-label="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06] space-y-4">
        <p className="text-xs font-medium text-white/55 uppercase tracking-wider">Add doctor</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Doctor name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Sarah Jones"
              className={inputClass}
            />
          </div>
          <div>
            <Label>Specialization</Label>
            <Input
              value={form.specialization}
              onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
              placeholder="e.g., Cardiologist"
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <Label className="mb-2">Available days</Label>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((day) => {
              const sel = form.availableDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`text-xs px-3 py-1 rounded-full transition-all border ${
                    sel
                      ? "bg-gradient-to-br from-violet-500/15 to-cyan-500/10 border-violet-300/40 text-white"
                      : "bg-white/[0.03] border-white/10 text-white/55 hover:bg-white/[0.06] hover:text-white/85"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>From</Label>
            <Input
              type="time"
              value={form.fromTime}
              onChange={(e) => setForm((f) => ({ ...f, fromTime: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <Label>To</Label>
            <Input
              type="time"
              value={form.toTime}
              onChange={(e) => setForm((f) => ({ ...f, toTime: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, acceptingNew: !f.acceptingNew }))}
            className="flex items-center gap-2"
          >
            <div className={`w-9 h-5 rounded-full transition-all relative border ${form.acceptingNew ? "ah-gradient-bg border-violet-300/40" : "bg-white/[0.06] border-white/10"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.acceptingNew ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <span className="text-xs text-white/65">Accepting new patients</span>
          </button>
          <GradientButton type="button" onClick={addDoctor} disabled={saving} size="sm">
            <Plus className="w-3.5 h-3.5" />
            {saving ? "Saving…" : "Add doctor"}
          </GradientButton>
        </div>
      </div>
    </GlassPanel>
  );
}
