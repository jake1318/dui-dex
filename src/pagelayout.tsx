/**
 * @file src/components/PageLayout.tsx
 * Last updated: 2025-01-24 07:50:56
 * Author: jake1318
 */

import { ReactNode } from "react";
import "./PageLayout.css";

interface PageLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export function PageLayout({ children, fullWidth = false }: PageLayoutProps) {
  return (
    <div className={`page-layout ${fullWidth ? "full-width" : "half-width"}`}>
      {children}
    </div>
  );
}
