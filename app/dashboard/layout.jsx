"use client"

import { useState, useEffect } from "react"
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
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-950">
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
          <Logo />
          <button
            type="button"
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto py-4 px-3">
          <nav className="space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  pathname === item.href
                    ? "bg-evertwine-100 text-evertwine-700 dark:bg-evertwine-900/30 dark:text-evertwine-300"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                </div>
              </Link>
            ))}
          </nav>

          <div className="mt-6 px-3">
            <Button
              onClick={() => {
                setSidebarOpen(false)
                router.push("/dashboard/promotions/new")
              }}
              className="w-full bg-evertwine-600 hover:bg-evertwine-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Promotion
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
          <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800">
            <Logo />
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto py-4 px-3">
            <nav className="flex-1 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    pathname === item.href
                      ? "bg-evertwine-100 text-evertwine-700 dark:bg-evertwine-900/30 dark:text-evertwine-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                  </div>
                </Link>
              ))}
            </nav>

            <div className="px-3 mt-6">
              <Button
                onClick={() => router.push("/dashboard/promotions/new")}
                className="w-full bg-evertwine-600 hover:bg-evertwine-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Promotion
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <button type="button" className="px-4 text-gray-500 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex items-center">
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentPage?.name || "Dashboard"}
                </h1>
                {currentPage?.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{currentPage.description}</p>
                )}
              </div>
            </div>

            <div className="ml-4 flex items-center gap-3">
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
                    <div className="h-9 w-9 rounded-full bg-evertwine-600 flex items-center justify-center text-white font-medium text-sm">
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
        <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  )
}
