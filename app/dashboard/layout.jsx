"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuthState, logout } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Logo } from "@/components/logo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, BarChart2, Tag, Settings, Menu, X, LogOut, User, Bell, Plus, HelpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import FirebaseError from "@/components/firebase-error"
import { firebaseInitError } from "@/lib/firebase"

export default function DashboardLayout({ children }) {
  const { user, userProfile, loading } = useAuthState()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // If Firebase initialization failed, show error component
  if (firebaseInitError) {
    return <FirebaseError />
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      description: "Overview and quick actions",
    },
    {
      name: "Promotions",
      href: "/dashboard/promotions",
      icon: Tag,
      description: "Manage your promotions",
      badge: "2",
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart2,
      description: "Performance insights",
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      description: "Account preferences",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Logo size="lg" className="justify-center mb-6" />
          <div className="loading-dots">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p className="text-muted-foreground mt-4">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const currentPage = navigation.find((item) => item.href === pathname)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Mobile sidebar */}
      <Suspense fallback={<div>Loading...</div>}>
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 flex max-w-xs w-full">
            <div className="flex-1 flex flex-col min-h-0 bg-card border-r shadow-xl">
              <div className="flex items-center justify-between h-16 px-6 border-b">
                <Logo />
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 flex flex-col overflow-y-auto py-4">
                <nav className="flex-1 px-4 space-y-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        pathname === item.href
                          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span>{item.name}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs opacity-75 mt-0.5">{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </nav>

                <div className="px-4 mt-6">
                  <Button
                    onClick={() => router.push("/dashboard/promotions/new")}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Promotion
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Suspense>

      {/* Static sidebar for desktop */}
      <Suspense fallback={<div>Loading...</div>}>
        <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex-1 flex flex-col min-h-0 bg-card/50 backdrop-blur-xl border-r shadow-sm">
            <div className="flex items-center h-16 px-6 border-b bg-card/80">
              <Logo />
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto py-6">
              <nav className="flex-1 px-4 space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      pathname === item.href
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-[1.02]"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs opacity-75 mt-0.5">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </nav>

              <div className="px-4 mt-6">
                <Button
                  onClick={() => router.push("/dashboard/promotions/new")}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  data-walkthrough="create-promotion"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Promotion
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Suspense>

      {/* Main content */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex-shrink-0 flex h-16 bg-card/80 backdrop-blur-xl border-b shadow-sm">
          <button
            type="button"
            className="px-4 border-r border-border text-muted-foreground lg:hidden hover:text-foreground hover:bg-accent transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex items-center max-w-lg">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-lg font-semibold text-foreground">{currentPage?.name || "Dashboard"}</h1>
                  {currentPage?.description && (
                    <p className="text-sm text-muted-foreground">{currentPage.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="ml-4 flex items-center gap-3">
              {/* Help */}
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <HelpCircle className="h-4 w-4" />
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </Button>

              {/* Theme toggle */}
              <ThemeToggle />

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 p-0 rounded-full overflow-hidden">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                      {userProfile?.name
                        ? userProfile.name.charAt(0).toUpperCase()
                        : user?.email?.charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userProfile?.name || "Business Owner"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/analytics" className="cursor-pointer">
                      <BarChart2 className="mr-2 h-4 w-4" />
                      <span>Analytics</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative">
          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
