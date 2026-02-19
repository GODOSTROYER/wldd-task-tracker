"use client";

import { useUser } from "@/lib/contexts/AuthContext";
import {
  ArrowLeft,
  Filter,
  LogOut,
  MoreHorizontal,
  Settings,
  Trello,
  User,
} from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "./ui/badge";
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
  boardTitle?: string;
  onEditBoard?: () => void;
  onFilterClick?: () => void;
  filterCount?: number;
  children?: React.ReactNode; // For extra controls like background chooser
}

export default function Navbar({
  boardTitle,
  onEditBoard,
  onFilterClick,
  filterCount = 0,
  children,
}: Props) {
  const { isSignedIn, user, signOut } = useUser();
  const pathname = usePathname();

  const isDashboardPage = pathname === "/dashboard" || pathname === "/tasks";
  const isBoardPage = pathname.startsWith("/boards/");

  const userInitials = user?.firstName
    ? user.firstName.slice(0, 2).toUpperCase()
    : user?.emailAddresses[0]?.emailAddress.slice(0, 2).toUpperCase();

  if (isDashboardPage) {
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
                        {user?.firstName || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.emailAddresses[0]?.emailAddress}
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

  if (isBoardPage) {
    return (
      <header className="bg-white/30 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <Link
                href="/tasks"
                className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-gray-900 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 hidden sm:block" />
              <div className="flex items-center space-x-2 min-w-0">
                <Trello className="text-blue-600" />
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-lg font-bold text-gray-900 truncate">
                    {boardTitle}
                  </span>
                  {onEditBoard && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={onEditBoard}
                    >
                      <MoreHorizontal />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {children}
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-white/20 bg-white/30 backdrop-blur-xl sticky top-0 z-50 shadow-sm transition-all">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Trello className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Task Tracker</span>
        </div>
        <div className="flex items-center space-x-4">
           <ModeToggle />
        </div>
      </div>
    </header>
  );
}
