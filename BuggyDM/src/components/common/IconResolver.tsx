"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Package,
  Layers,
  Grid,
  User,
  Users,
  BarChart3,
  ShoppingBag,
  LayoutDashboard,
  TrendingUp,
  MapPin,
  Database,
  Truck,
  Megaphone,
  DollarSign,
  Sparkles,
  FileText,
  Eye,
  Scan,
  RotateCcw,
  WifiOff,
  Boxes,
  ClipboardCheck,
  Warehouse,
  Settings,
  Building2,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Sliders,
  FolderSync,
  HardDrive,
  Activity,
  HelpCircle,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Package,
  Layers,
  Grid,
  User,
  Users,
  BarChart3,
  ShoppingBag,
  LayoutDashboard,
  TrendingUp,
  MapPin,
  Database,
  Truck,
  Megaphone,
  DollarSign,
  Sparkles,
  FileText,
  Eye,
  Scan,
  RotateCcw,
  WifiOff,
  Boxes,
  ClipboardCheck,
  Warehouse,
  Settings,
  Building2,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Sliders,
  FolderSync,
  HardDrive,
  Activity,
  HelpCircle,
};

interface IconResolverProps {
  name: string | null | undefined;
  className?: string;
  fallback?: string;
}

export default function IconResolver({
  name,
  className = "w-4 h-4",
  fallback = "Package",
}: IconResolverProps) {
  const FallbackIcon = (fallback && ICON_MAP[fallback]) || Package;

  if (!name) {
    return <FallbackIcon className={className} />;
  }

  // Look up icon component from explicit map with safe fallback
  const IconComponent = ICON_MAP[name] || FallbackIcon;

  return <IconComponent className={className} />;
}
