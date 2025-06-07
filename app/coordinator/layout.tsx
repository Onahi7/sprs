import type { ReactNode } from "react"
import { CoordinatorLayoutClient } from "../../components/coordinator/coordinator-layout-client"

export default function CoordinatorLayout({ children }: { children: ReactNode }) {
  return <CoordinatorLayoutClient>{children}</CoordinatorLayoutClient>
}
