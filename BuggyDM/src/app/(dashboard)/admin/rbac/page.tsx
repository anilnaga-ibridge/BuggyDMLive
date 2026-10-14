"use client";

import React, { useState } from "react";
import { 
  Users, 
  Lock, 
  Smartphone, 
  RefreshCw, 
  KeyRound, 
  CheckCircle,
} from "lucide-react";
import { getRbacOverview, updateAdminRbac } from "@/app/actions/rbac";
import { getErrorMessage } from "@/lib/errors";
import { useActionQuery } from "@/hooks/useActionQuery";

type StaffMember = Awaited<ReturnType<typeof getRbacOverview>>["staff"][number];

export default function RbacPage() {
  const { data, isLoading: loading, refetch } = useActionQuery(
    "admin-rbac",
    getRbacOverview,
  );
  const staff = data?.staff || [];

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [editDesignation, setEditDesignation] = useState("");
  const [editShiftStatus, setEditShiftStatus] = useState("Offline");
  const [editDeviceBindingId, setEditDeviceBindingId] = useState("");

  const [statusMsg, setStatusMsg] = useState("");

  const handleEditStaff = (member: StaffMember) => {
    setSelectedStaff(member);
    setEditDesignation(member.designation || "Staff Member");
    setEditShiftStatus(member.shiftStatus || "Offline");
    setEditDeviceBindingId(member.deviceBindingId === "Unbound" ? "" : member.deviceBindingId);
  };

  const handleSaveRbac = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      await updateAdminRbac(
        selectedStaff.id,
        editDesignation,
        editShiftStatus,
        editDeviceBindingId || undefined
      );
      setStatusMsg(`Updated RBAC & Device Binding for ${selectedStaff.fullName}!`);
      setSelectedStaff(null);
      void refetch();
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (error) {
      alert(getErrorMessage(error, "Failed to update staff access"));
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="flex items-center justify-between glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Enterprise RBAC & Device Binding Console</h1>
            <p className="text-xs text-slate-400">Department roles, shift status management, and physical hardware binding security</p>
          </div>
        </div>

        <button 
          onClick={() => void refetch()}
          className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Staff Table */}
        <div className="col-span-8 glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Workforce & Dark Store Terminals</h2>
            </div>
            <span className="text-xs text-slate-500">{staff.length} Staff Profiles Listed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Staff Member</th>
                  <th className="pb-3 font-semibold">Designation</th>
                  <th className="pb-3 font-semibold">Shift Status</th>
                  <th className="pb-3 font-semibold">Hardware Lock</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-900/30">
                    <td className="py-3">
                      <div className="font-semibold text-white">{member.fullName}</div>
                      <div className="text-[10px] text-slate-500">{member.email}</div>
                    </td>
                    <td className="py-3">
                      <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                        {member.designation}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        member.shiftStatus === "Online" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        {member.shiftStatus}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-[10px]">
                      {member.deviceBindingId !== "Unbound" ? (
                        <span className="text-violet-400 flex items-center gap-1">
                          <Smartphone className="w-3 h-3" /> {member.deviceBindingId}
                        </span>
                      ) : (
                        <span className="text-slate-500">Unbound</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleEditStaff(member)}
                        className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                      >
                        Edit RBAC & Binding
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Roles & Permissions Matrix */}
        <div className="col-span-4 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <KeyRound className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Role Approval Levels</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-white">Store Manager</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                  Level 5 Approval
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Full access to inventory overrides, station pausing, and SLA escalation alerts.</p>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-white">Shift Supervisor</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                  Level 3 Approval
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Operator relocation, exception override resolutions, and station toggles.</p>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-white">Picker & Packer</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  Level 1 Terminal Access
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Barcode scanner interface, item verification, and bin destination routing.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Staff RBAC Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-md border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Edit RBAC & Binding: {selectedStaff.fullName}
            </h2>
            <form onSubmit={handleSaveRbac} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Designation</label>
                <select 
                  value={editDesignation} 
                  onChange={(e) => setEditDesignation(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                >
                  <option value="Store Manager">Store Manager</option>
                  <option value="Shift Supervisor">Shift Supervisor</option>
                  <option value="Lead Picker">Lead Picker</option>
                  <option value="Packer">Packer</option>
                  <option value="Rider">Rider</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Shift Status</label>
                <select 
                  value={editShiftStatus} 
                  onChange={(e) => setEditShiftStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                >
                  <option value="Online">Online</option>
                  <option value="On Break">On Break</option>
                  <option value="Offline">Offline</option>
                  <option value="Cash Settlement">Cash Settlement</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Device Hardware ID Binding</label>
                <input 
                  type="text" 
                  value={editDeviceBindingId} 
                  onChange={(e) => setEditDeviceBindingId(e.target.value)}
                  placeholder="e.g. TER-MAMP-8821"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Binds workstation hardware to prevent unauthorized login.</span>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button 
                  type="button" 
                  onClick={() => setSelectedStaff(null)}
                  className="px-4 py-2 border border-slate-800 rounded-lg text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
