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
