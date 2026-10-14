"use client";

import React, { useState } from "react";
import {
  Building2,
  Plus,
  RefreshCw,
  FolderTree,
  Layers,
  ShieldCheck,
  Globe
} from "lucide-react";
import { getOrganizations, createOrganization, addHierarchyNode } from "@/app/actions/organization";
import { getErrorMessage } from "@/lib/errors";
import { useActionQuery } from "@/hooks/useActionQuery";

export default function OrganizationPage() {
  const { data: orgs = [], isLoading: loading, refetch } = useActionQuery(
    "admin-organizations",
    getOrganizations,
  );
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  const [showOrgModal, setShowOrgModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgCode, setNewOrgCode] = useState("");
  const [newOrgTaxId, setNewOrgTaxId] = useState("");

  const [showNodeModal, setShowNodeModal] = useState(false);
  const [newNodeName, setNewNodeName] = useState("");
  const [newNodeLevel, setNewNodeLevel] = useState("Region");
  const [newNodeParentId, setNewNodeParentId] = useState("");

  const [statusMsg, setStatusMsg] = useState("");

  const effectiveOrgId = selectedOrgId || orgs[0]?.id || "";
  const activeOrg = orgs.find((o) => o.id === effectiveOrgId) || orgs[0];

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newOrgCode) return;
    try {
      await createOrganization(newOrgName, newOrgCode, newOrgTaxId);
      setStatusMsg(`Organization '${newOrgName}' created successfully!`);
      setShowOrgModal(false);
      setNewOrgName("");
      setNewOrgCode("");
      setNewOrgTaxId("");
      void refetch();
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (error) {
      alert(getErrorMessage(error, "Failed to create organization"));
    }
  };

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName || !effectiveOrgId) return;
    try {
      await addHierarchyNode(effectiveOrgId, newNodeName, newNodeLevel, newNodeParentId || undefined);
      setStatusMsg(`Hierarchy node '${newNodeName}' added under ${activeOrg?.name}!`);
      setShowNodeModal(false);
      setNewNodeName("");
      void refetch();
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (error) {
      alert(getErrorMessage(error, "Failed to add hierarchy node"));
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Header & Controls */}
      <div className="flex items-center justify-between glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Organization & Enterprise Hierarchy</h1>
            <p className="text-xs text-slate-400">Manage global holdings, regional clusters, zones, and dark store topography</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOrgModal(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Organization</span>
          </button>
          <button
            onClick={() => void refetch()}
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Select Organization Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {orgs.map((org) => (
          <button
            key={org.id}
            onClick={() => setSelectedOrgId(org.id)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
              effectiveOrgId === org.id
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{org.name} ({org.code})</span>
          </button>
        ))}
      </div>

      {/* Main Grid */}
      {activeOrg && (
        <div className="grid grid-cols-12 gap-6">
          {/* Org Info Card */}
          <div className="col-span-4 glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-sm font-bold">{activeOrg.name}</h2>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mt-1 inline-block">
                  {activeOrg.code}
                </span>
              </div>
              <Building2 className="w-8 h-8 text-slate-700" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Tax ID:</span>
                <span className="font-mono text-slate-300">{activeOrg.tax_id || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hierarchy Nodes:</span>
                <span className="font-mono text-slate-300">{activeOrg.hierarchies?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Dark Stores:</span>
                <span className="font-mono text-emerald-400">{activeOrg.stores?.length || 0}</span>
              </div>
            </div>

            <button
              onClick={() => setShowNodeModal(true)}
              className="w-full py-2.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold text-xs rounded-xl hover:bg-emerald-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Hierarchy Node (Region/Cluster/Zone)</span>
            </button>
          </div>

          {/* Organizational Hierarchy Tree */}
          <div className="col-span-8 glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-sm font-bold uppercase text-slate-400 tracking-wider">Enterprise Topology Tree</h2>
                </div>
                <span className="text-xs text-slate-500">Region &rarr; Cluster &rarr; Zone &rarr; Dark Store</span>
              </div>

              {/* Hierarchy List */}
              <div className="space-y-3">
                {activeOrg.hierarchies?.map((node) => (
                  <div key={node.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <div>
                        <h3 className="text-xs font-semibold text-white">{node.name}</h3>
                        <span className="text-[10px] text-slate-500 font-mono">Level: {node.level_type}</span>
                      </div>
                    </div>

                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      Active Node
                    </span>
                  </div>
                ))}

                {(!activeOrg.hierarchies || activeOrg.hierarchies.length === 0) && (
                  <p className="text-xs text-slate-500 italic text-center py-10">No topology nodes defined for this organization.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Organization */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-md border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Create New Organization</h2>
            <form onSubmit={handleCreateOrg} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Organization Name</label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Buggy Retail West Inc"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Organization Code</label>
                <input
                  type="text"
                  value={newOrgCode}
                  onChange={(e) => setNewOrgCode(e.target.value)}
                  placeholder="e.g. BUGGY-WEST"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Tax ID / Registration</label>
                <input
                  type="text"
                  value={newOrgTaxId}
                  onChange={(e) => setNewOrgTaxId(e.target.value)}
                  placeholder="e.g. GSTIN-36AAACB1234F"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  className="px-4 py-2 border border-slate-800 rounded-lg text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg cursor-pointer"
                >
                  Create Holding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Hierarchy Node */}
      {showNodeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-6 rounded-2xl w-full max-w-md border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Add Hierarchy Node</h2>
            <form onSubmit={handleAddNode} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Node Name</label>
                <input
                  type="text"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder="e.g. Bangalore North Region"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Level Type</label>
                <select
                  value={newNodeLevel}
                  onChange={(e) => setNewNodeLevel(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                >
                  <option value="Region">Region</option>
                  <option value="Cluster">Cluster</option>
                  <option value="Zone">Zone</option>
                  <option value="Store">Store</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Parent Node</label>
                <select
                  value={newNodeParentId}
                  onChange={(e) => setNewNodeParentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white"
                >
                  <option value="">Organization root</option>
                  {activeOrg?.hierarchies.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name} ({node.level_type})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNodeModal(false)}
                  className="px-4 py-2 border border-slate-800 rounded-lg text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-lg cursor-pointer"
                >
                  Save Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
