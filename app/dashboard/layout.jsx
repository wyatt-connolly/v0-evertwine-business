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
import { Home, BarChart2, Tag, Settings, Menu, X, LogOut, User, Bell, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import FirebaseError from "@/components/firebase-error"
import { firebaseInitError } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function DashboardLayout({ children }) {
  const { user, userProfile, loading } = useAuthState()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [promotionsCount, setPromotionsCount] = useState(0)

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchPromotionsCount = async () => {
      if (!user) return

      try {
        const promotionsQuery = query(
          collection(db, "promotions"),
          where("business_id", "==", user.uid),
          where("status", "==", "live"),
        )
        const promotionsSnapshot = await getDocs(promotionsQuery)
        setPromotionsCount(promotionsSnapshot.docs.length)
      } catch (error) {
        console.error("Error fetching promotions count:", error)
        setPromotionsCount(0)
      }
    }

    fetchPromotionsCount()
  }, [user])

  // If Firebase initialization failed, show error component
  if (firebaseInitError) {
    return <FirebaseError />
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
      badge: promotionsCount > 0 ? promotionsCount.toString() : undefined,
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

  const currentPage = navigation.find((item) => item.href === pathname)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gradient-mesh">
        <div className="text-center animate-scale-in">
          <Logo size="lg" className="justify-center mb-6 animate-glow" />
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

  return (
    <div className="min-h-screen gradient-mesh">
      {/* Mobile sidebar */}
      <Suspense fallback={<div>Loading...</div>}>
        <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 flex max-w-xs w-full animate-slide-up">
            <div className="flex-1 flex flex-col min-h-0 glass-card border-r shadow-xl">
              <div className="flex items-center justify-between h-16 px-6 border-b border-white/20">
                <Logo />
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all duration-200"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 flex flex-col overflow-y-auto py-4">
                <nav className="flex-1 px-3 space-y-2">
                  {navigation.map((item, index) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300 hover-lift animate-slide-up ${
                        pathname === item.href
                          ? "gradient-primary text-white shadow-lg"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                      }`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span>{item.name}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-2 text-xs animate-pulse">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs opacity-75 mt-0.5">{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </nav>

                <div className="px-3 mt-6">
                  <Button
                    onClick={() => router.push("/dashboard/promotions/new")}
                    className="w-full btn-gradient text-white shadow-lg hover-lift"
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
          <div className="flex-1 flex flex-col min-h-0 sidebar-gradient border-r shadow-sm">
            <div className="flex items-center h-16 px-6 border-b border-white/20">
              <Logo className="animate-fade-in" />
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto py-6">
              <nav className="flex-1 px-4 space-y-2">
                {navigation.map((item, index) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 hover-lift animate-slide-up ${
                      pathname === item.href
                        ? "gradient-primary text-white shadow-lg transform scale-[1.02]"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-2 text-xs animate-pulse">
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
                  className="w-full btn-gradient text-white shadow-lg hover-lift animate-glow"
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
        <div className="sticky top-0 z-40 flex-shrink-0 flex h-16 nav-gradient shadow-sm">
          <button
            type="button"
            className="px-4 border-r border-white/20 text-muted-foreground lg:hidden hover:text-foreground hover:bg-white/10 transition-all duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex items-center max-w-lg">
              <div className="flex items-center gap-4 animate-slide-up">
                <div>
                  <h1 className="text-lg font-semibold text-gradient">{currentPage?.name || "Dashboard"}</h1>
                  {currentPage?.description && (
                    <p className="text-sm text-muted-foreground">{currentPage.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="ml-4 flex items-center gap-3 animate-fade-in">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="h-9 w-9 relative hover-glow transition-all duration-200">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse"></span>
              </Button>

              {/* Theme toggle */}
              <ThemeToggle />

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 p-0 rounded-full overflow-hidden hover-glow">
                    <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-white font-medium text-sm">
                      {userProfile?.name
                        ? userProfile.name.charAt(0).toUpperCase()
                        : user?.email?.charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-card animate-scale-in">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userProfile?.name || "Business Owner"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer hover-lift">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/analytics" className="cursor-pointer hover-lift">
                      <BarChart2 className="mr-2 h-4 w-4" />
                      <span>Analytics</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600 hover-lift"
                  >
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
          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  )
}
