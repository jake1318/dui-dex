/**
 * @file src/components/PageLayout.tsx
 * Last updated: 2025-01-24 22:56:31
 * Author: jake1318
 */

import { ReactNode } from "react";
import "./pagelayout.css";

interface PageLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export function PageLayout({ children, fullWidth = false }: PageLayoutProps) {
  const pageClass = fullWidth
    ? "page-layout full-width"
    : "page-layout half-width";

  return <div className={pageClass}>{children}</div>;
}
