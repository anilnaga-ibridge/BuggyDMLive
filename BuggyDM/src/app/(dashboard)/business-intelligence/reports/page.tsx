"use client";

import { FileText, Download } from "lucide-react";
import { useState } from "react";
import {
  getProcurementReportData,
  getVipCustomersReportData,
  getWastageReportData
} from "@/app/actions/reports-bi";

export default function ReportsExport() {
  const [downloading, setDownloading] = useState<string | null>(null);

  // Helper to convert arrays of objects to CSV
  const convertToCSV = (array: Array<Record<string, unknown>>) => {
    let str = "";
    if (array.length === 0) return "";

    const headers = Object.keys(array[0]);
    str += headers.join(",") + "\r\n";

    for (let i = 0; i < array.length; i++) {
      let line = "";
      for (const index in headers) {
        if (line !== "") line += ",";
        const val = array[i][headers[index]];
        line += typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
      }
      str += line + "\r\n";
    }
    return str;
  };

  const triggerDownload = (filename: string, csvData: string) => {
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (type: string) => {
    setDownloading(type);

    try {
      if (type === "procurement") {
        let data = await getProcurementReportData();
        if (data.length === 0) {
          data = [
            { Product: "No Low Stock Items Found", Stock: 0, Price: "₹0.00", AvgDailySales: 0, DaysLeft: 0, SuggestedPurchase: 0 }
          ];
        }
        const csv = convertToCSV(data);
        triggerDownload("procurement_planner_report.csv", csv);
      }
      else if (type === "vip_customers") {
        let data = await getVipCustomersReportData();
        if (data.length === 0) {
          data = [
            { Name: "No Customer Orders Found", Phone: "N/A", Email: "N/A", LifetimeSpend: 0, TotalOrders: 0 }
          ];
        }
        const csv = convertToCSV(data);
        triggerDownload("vip_customers_report.csv", csv);
      }
      else if (type === "wastage") {
        const data = await getWastageReportData();
        const csv = convertToCSV(data);
        triggerDownload("wastage_summary_report.csv", csv);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(null);
    }
  };

  const reports = [
    {
      id: "procurement",
      title: "Procurement Planner Report",
      desc: "Weekly inventory planning sheet listing run-rates, remaining days of stock, and recommended quantities.",
      format: "CSV",
    },
    {
      id: "vip_customers",
      title: "VIP Customer Directory",
      desc: "Client retention sheet listing high-value customer details, total orders count, and lifetime spends.",
      format: "CSV",
    },
    {
      id: "wastage",
      title: "Wastage & Cancellation Summary",
      desc: "Cost optimization overview of refunds, canceled orders, and lost values over the last 30 days.",
      format: "CSV",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <FileText className="w-7 h-7 text-emerald-500" />
          Download Center & Scheduled Reports
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Export operations matrices and business audits to CSV formats dynamically from the live database.
        </p>
      </div>

      <div className="space-y-6">
        {reports.map((r) => (
          <div key={r.id} className="glass-panel p-6 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-white">{r.title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl">{r.desc}</p>
              <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-900 text-slate-400 border border-slate-800">
                {r.format} FORMAT
              </span>
            </div>

            <button
              onClick={() => handleExport(r.id)}
              disabled={downloading !== null}
              className="flex items-center gap-2 py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-sm font-semibold text-[#070a13] disabled:opacity-50 disabled:active:scale-100 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all duration-200"
            >
              {downloading === r.id ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#070a13] border-t-transparent rounded-full animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Report</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
