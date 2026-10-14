"use client";

import React from "react";
import * as LucideIcons from "lucide-react";

interface IconResolverProps {
  name: string | null | undefined;
  className?: string;
  fallback?: keyof typeof LucideIcons;
}

export default function IconResolver({ name, className = "w-4 h-4", fallback = "Package" }: IconResolverProps) {
  if (!name) {
    const FallbackIcon = (LucideIcons[fallback] as React.ElementType) || LucideIcons.Package;
    return <FallbackIcon className={className} />;
  }

  // Look up icon component dynamically from lucide-react
  const IconComponent = (LucideIcons[name as keyof typeof LucideIcons] as React.ElementType) || LucideIcons[fallback] || LucideIcons.Package;

  return <IconComponent className={className} />;
}
