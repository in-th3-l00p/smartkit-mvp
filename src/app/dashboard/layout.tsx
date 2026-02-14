'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Wallet, ArrowLeftRight, Key, FileText, Layers, BarChart3, Settings, ScrollText, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/wallets", label: "Wallets", icon: Wallet },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/logs", label: "Logs", icon: ScrollText },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <Layers className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">SmartKit</span>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <span className="text-sm text-muted-foreground">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/docs">
              <Button variant="ghost" size="sm">
                <FileText className="h-4 w-4 mr-1" /> Docs
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 border-r bg-background min-h-[calc(100vh-3.5rem)] p-4 hidden md:block">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  )
}
