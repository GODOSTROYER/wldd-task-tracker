"use client";

import { useUser } from "@/lib/contexts/AuthContext";
import {
  LogOut,
  Settings,
  User,
  Layout,
} from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";

interface Props {
  children?: React.ReactNode;
}

export default function Navbar({ children }: Props) {
  const { isSignedIn, user, signOut } = useUser();
  const pathname = usePathname();

  const isAppPage = pathname === "/dashboard" || pathname === "/tasks" || pathname.startsWith("/workspaces");

  const userInitials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "U";

  if (isAppPage) {
    return (
      <header className="border-b border-white/20 bg-white/30 backdrop-blur-xl sticky top-0 z-50 shadow-sm transition-all">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Layout className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Task Tracker
          </span>
        </Link>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {children}
            <ModeToggle />

            {isSignedIn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-white/20 bg-white/30 backdrop-blur-xl sticky top-0 z-50 shadow-sm transition-all">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Layout className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold text-gray-900">Task Tracker</span>
        </div>
        <div className="flex items-center space-x-4">
           <ModeToggle />
        </div>
      </div>
    </header>
  );
}
