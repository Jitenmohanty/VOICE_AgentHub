"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
  accentColor?: string;
}

export function DoctorRoster({ businessId, agentId, accentColor = "#10B981" }: DoctorRosterProps) {
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
        const docData = d.data?.find(
          (item: { dataType: string }) => item.dataType === "doctors",
        );
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Stethoscope className="w-4 h-4" style={{ color: accentColor }} />
        <h3 className="text-sm font-medium text-white">Doctor Roster</h3>
        <span className="text-xs text-[#666680]">({doctors.length} doctors)</span>
      </div>

      {/* Current doctors */}
      {doctors.length > 0 && (
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start justify-between bg-white/[0.03] rounded-lg px-3 py-2.5 border border-[#2A2A3E]"
            >
              <div className="min-w-0">
                <p className="text-sm text-white font-medium">Dr. {doc.name}</p>
                {doc.specialization && (
                  <p className="text-xs text-[#8888AA]">{doc.specialization}</p>
                )}
                <p className="text-xs text-[#666680] mt-0.5">
                  {doc.availableDays.map((d) => d.slice(0, 3)).join(", ")} · {doc.fromTime} –{" "}
                  {doc.toTime}
                </p>
                <span
                  className="text-xs"
                  style={{ color: doc.acceptingNew ? accentColor : "#8888AA" }}
                >
                  {doc.acceptingNew ? "Accepting new patients" : "Not accepting new patients"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeDoctor(doc.id)}
                className="text-[#8888AA] hover:text-red-400 p-1 shrink-0 ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add doctor form */}
      <div className="bg-white/[0.03] rounded-xl p-4 border border-[#2A2A3E] space-y-3">
        <p className="text-xs font-medium text-[#8888AA]">Add Doctor</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[#8888AA] text-xs">Doctor Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Sarah Jones"
              className="mt-1 bg-white/5 border-[#2A2A3E] text-white text-sm h-8"
            />
          </div>
          <div>
            <Label className="text-[#8888AA] text-xs">Specialization</Label>
            <Input
              value={form.specialization}
              onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
              placeholder="e.g., Cardiologist"
              className="mt-1 bg-white/5 border-[#2A2A3E] text-white text-sm h-8"
            />
          </div>
        </div>
        <div>
          <Label className="text-[#8888AA] text-xs mb-1.5 block">Available Days</Label>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((day) => {
              const sel = form.availableDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className="text-xs px-2.5 py-1 rounded-full transition-all"
                  style={{
                    backgroundColor: sel ? `${accentColor}20` : "rgba(255,255,255,0.05)",
                    color: sel ? accentColor : "#8888AA",
                    border: `1px solid ${sel ? `${accentColor}40` : "transparent"}`,
                  }}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[#8888AA] text-xs">From</Label>
            <Input
              type="time"
              value={form.fromTime}
              onChange={(e) => setForm((f) => ({ ...f, fromTime: e.target.value }))}
              className="mt-1 bg-white/5 border-[#2A2A3E] text-white text-sm h-8"
            />
          </div>
          <div>
            <Label className="text-[#8888AA] text-xs">To</Label>
            <Input
              type="time"
              value={form.toTime}
              onChange={(e) => setForm((f) => ({ ...f, toTime: e.target.value }))}
              className="mt-1 bg-white/5 border-[#2A2A3E] text-white text-sm h-8"
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, acceptingNew: !f.acceptingNew }))}
            className="flex items-center gap-2"
          >
            <div
              className={`w-8 h-4 rounded-full transition-colors relative ${form.acceptingNew ? "bg-[#00D4FF]" : "bg-[#2A2A3E]"}`}
            >
              <div
                className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${form.acceptingNew ? "translate-x-4" : "translate-x-0.5"}`}
              />
            </div>
            <span className="text-xs text-[#8888AA]">Accepting New Patients</span>
          </button>
          <Button
            type="button"
            onClick={addDoctor}
            disabled={saving}
            size="sm"
            className="h-7 text-xs bg-[#00D4FF] text-black hover:bg-[#00D4FF]/80 border-0"
          >
            <Plus className="w-3 h-3 mr-1" />
            {saving ? "Saving..." : "Add Doctor"}
          </Button>
        </div>
      </div>
    </div>
  );
}
