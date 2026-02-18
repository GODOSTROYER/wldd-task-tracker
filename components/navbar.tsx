"use client";

import { useUser } from "@/lib/contexts/AuthContext";
import {
  ArrowLeft,
  ArrowRight,
  Filter,
  MoreHorizontal,
  Trello,
} from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "./ui/badge";
import { removeToken } from "@/lib/api";

interface Props {
  boardTitle?: string;
  onEditBoard?: () => void;

  onFilterClick?: () => void;
  filterCount?: number;
}
export default function Navbar({
  boardTitle,
  onEditBoard,
  onFilterClick,
  filterCount = 0,
}: Props) {
  const { isSignedIn, user, signOut } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const isDashboardPage = pathname === "/dashboard" || pathname === "/tasks";
  const isBoardPage = pathname.startsWith("/boards/");

  if (isDashboardPage) {
    return (
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trello className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <span className="text-xl sm:text-2xl font-bold text-gray-900">
              Task Tracker
            </span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {isSignedIn && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 hidden sm:block">
                  {user?.firstName ?? user?.emailAddresses[0]?.emailAddress}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-xs sm:text-sm"
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  if (isBoardPage) {
    return (
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <Link
                href="/tasks"
                className="flex items-center space-x-1 sm:space-x-2 text-gray-600 hover:text-gray-900 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Back to dashboard</span>
                <span className="sm:hidden">Back</span>
              </Link>
              <div className="h-4 sm:h-6 w-px bg-gray-300 hidden sm:block" />
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                <Trello className="text-blue-600" />
                <div className="items-center space-x-1 sm:space-x-2 min-w-0">
                  <span className="text-lg font-bold text-gray-900 truncate">
                    {boardTitle}
                  </span>
                  {onEditBoard && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 flex-shrink-0 p-0"
                      onClick={onEditBoard}
                    >
                      <MoreHorizontal />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {onFilterClick && (
                <Button
                  variant="outline"
                  size="sm"
                  className={`text-xs sm:text-sm ${
                    filterCount > 0 ? "bg-blue-100 border-blue-200" : ""
                  }`}
                  onClick={onFilterClick}
                >
                  <Filter className="h-3 w-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Filter</span>
                  {filterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-xs ml-1 sm:ml-2 bg-blue-100 border-blue-200"
                    >
                      {filterCount}
                    </Badge>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Trello className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <span className="text-xl sm:text-2xl font-bold text-gray-900">
            TrelloClone
          </span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {isSignedIn ? (
            <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                Welcome, {user?.firstName ?? user?.emailAddresses[0]?.emailAddress}
              </span>
              <Link href="/tasks">
                <Button size="sm" className="text-xs sm:text-sm">
                  Go to Dashboard <ArrowRight />
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="text-xs sm:text-sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
