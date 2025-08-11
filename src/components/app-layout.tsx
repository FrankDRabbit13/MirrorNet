"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarMenuBadge,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { getReceivedInvitesForUser, getRevealRequestsForUser, getFamilyGoalsForUser } from "@/lib/data";
import {
  LayoutDashboard,
  Mail,
  User,
  LogOut,
  Settings,
  Search,
  HelpCircle,
  Sparkles,
  Leaf,
  Gem,
  Heart,
  Target,
  MessageSquareQuote,
  ShieldCheck,
  Users2,
  LoaderCircle,
  Frame,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Badge } from "@/components/ui/badge";

function Logo() {
  return (
    <Link
      href="/dashboard"
      className="flex flex-col items-start group-data-[collapsible=icon]:items-center"
    >
      <div className="flex items-center gap-2.5 font-bold text-lg font-headline text-primary">
        <Frame className="w-7 h-7" />
        <span className="group-data-[collapsible=icon]:hidden">MirrorNet™</span>
      </div>
    </Link>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();
  const isActive = (path: string) => pathname.startsWith(path);
  const [inviteCount, setInviteCount] = useState(0);
  const [revealRequestCount, setRevealRequestCount] = useState(0);
  const [goalSuggestionCount, setGoalSuggestionCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        const [receivedInvites, revealRequests, familyGoals] = await Promise.all([
            getReceivedInvitesForUser(user.id),
            user.isPremium ? getRevealRequestsForUser(user.id) : Promise.resolve([]),
            getFamilyGoalsForUser(user.id),
        ]);
        const actionableInvites = receivedInvites.filter(invite => !!invite.circleId && invite.status === 'pending');
        setInviteCount(actionableInvites.length);
        setRevealRequestCount(revealRequests.length);
        setGoalSuggestionCount(familyGoals.length);
      };
      
      fetchNotifications();
    }
  }, [user, pathname]); // Re-fetch when user changes or on navigation

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (loading || !user) {
    // You can show a loading spinner here
    return (
        <div className="w-full h-screen flex items-center justify-center">
            <LoaderCircle className="w-10 h-10 text-primary animate-spin" />
        </div>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent className="pt-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/dashboard"}
                tooltip="Dashboard"
              >
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/search")}
                tooltip="Search"
              >
                <Link href="/search">
                  <Search />
                  <span>Search</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/invites")}
                tooltip="Requests"
              >
                <Link href="/invites" className="flex items-center w-full">
                   <Mail />
                   <span className="flex-1">Requests</span>
                   {inviteCount > 0 && (
                     <SidebarMenuBadge className="static ml-auto group-data-[collapsible=icon]:hidden bg-primary text-primary-foreground">
                       {inviteCount}
                     </SidebarMenuBadge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/goals")}
                tooltip="Family Goals"
              >
                <Link href="/goals" className="w-full">
                  <Target />
                  <span className="flex-1">Family Goals</span>
                  {goalSuggestionCount > 0 && (
                     <SidebarMenuBadge className="static ml-auto group-data-[collapsible=icon]:hidden bg-primary text-primary-foreground">
                       {goalSuggestionCount}
                     </SidebarMenuBadge>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/eco-rating")}
                tooltip="Eco Rating"
              >
                <Link href="/eco-rating" className="w-full">
                  <Leaf />
                  <span className="flex-1">
                    <span className="mr-2">Eco Rating</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 group-data-[collapsible=icon]:hidden">Beta</Badge>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             {user.isPremium ? (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/attraction-ratings")}
                  tooltip="Attraction Ratings"
                >
                  <Link href="/attraction-ratings" className="w-full">
                    <Heart />
                    <span className="flex-1">
                      <span className="mr-2">Attraction</span>
                      <Badge variant="premium" className="text-xs px-1.5 py-0.5 group-data-[collapsible=icon]:hidden">
                        <Gem className="w-3 h-3 mr-1"/>Premium
                      </Badge>
                    </span>
                     {revealRequestCount > 0 && (
                        <SidebarMenuBadge className="static ml-auto group-data-[collapsible=icon]:hidden bg-primary text-primary-foreground">
                          {revealRequestCount}
                        </SidebarMenuBadge>
                      )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : (
                <SidebarMenuItem>
                    <SidebarMenuButton
                    asChild
                    isActive={isActive("/premium")}
                    tooltip="Go Premium"
                    >
                    <Link href="/premium">
                        <Gem />
                        <span>Go Premium</span>
                    </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/traits")}
                tooltip="Traits Guide"
              >
                <Link href="/traits">
                  <Sparkles />
                  <span>Traits</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/feedback")}
                tooltip="Give Feedback"
              >
                <Link href="/feedback">
                  <MessageSquareQuote />
                  <span>Give Feedback</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive("/faq")}
                tooltip="FAQ"
              >
                <Link href="/faq">
                  <HelpCircle />
                  <span>FAQ</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {user.isAdmin && (
              <>
                <SidebarSeparator />
                 <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin/user-management")}
                    tooltip="User Management"
                  >
                    <Link href="/admin/user-management">
                      <Users2 />
                      <span>User Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin/feedback-review")}
                    tooltip="Feedback Review"
                  >
                    <Link href="/admin/feedback-review">
                      <ShieldCheck />
                      <span>Feedback Review</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start items-center gap-3 p-2 h-auto"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.photoUrl}
                    alt={user.displayName}
                  />
                  <AvatarFallback>
                    {user.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left group-data-[collapsible=icon]:hidden">
                    <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm truncate">
                            {user.displayName}
                        </p>
                        {user.isPremium && <Gem className="w-4 h-4 text-primary shrink-0" />}
                    </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center h-14 px-4 border-b lg:px-6 bg-background sticky top-0 z-30">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1 flex justify-end">
             <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
        <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
          <p className="text-xs text-muted-foreground">&copy; 2025 MirrorNet™. All rights reserved.</p>
           <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link
              href="/terms-of-service"
              className="text-xs hover:underline underline-offset-4"
            >
              Terms of Service
            </Link>
          </nav>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
