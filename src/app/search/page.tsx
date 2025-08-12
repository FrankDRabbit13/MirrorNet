"use client";

import { useState, useEffect, useTransition } from "react";
import { useUser } from "@/hooks/use-user";
import { searchUsers, getOwnedCirclesForUser, sendInvite, type User, type Circle, getSuggestedUsers, type SuggestedUser, getCircleMembershipsForUser } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Send, UserPlus, LoaderCircle, Users, Gem, Sparkles } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

function UserCard({
  user,
  onInvite,
  suggestion,
}: {
  user: User;
  onInvite: (user: User) => void;
  suggestion?: { viaUser: User; viaCircle: string };
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={user.photoUrl} alt={user.displayName} />
          <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{user.displayName}</p>
            {user.isPremium && <Gem className="w-4 h-4 text-primary" />}
          </div>
          {suggestion && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3"/> In the {suggestion.viaCircle} circle with {suggestion.viaUser.displayName}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => onInvite(user)}>
            <Plus className="mr-2 h-4 w-4" /> Add to Circle
        </Button>
      </div>
    </div>
  );
}

function UserCardSkeleton() {
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-40" />
                </div>
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-9 w-28" />
            </div>
        </div>
    );
}

export default function SearchPage() {
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [ownedCircles, setOwnedCircles] = useState<Omit<Circle, 'members' | 'traits'>[]>([]);
  const [selectedCircleIds, setSelectedCircleIds] = useState<string[]>([]);
  const [existingMemberships, setExistingMemberships] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDialog, setIsLoadingDialog] = useState(false);

  // Fetch search results
  useEffect(() => {
    startSearchTransition(async () => {
      if (currentUser && searchTerm.trim().length > 1) {
        const foundUsers = await searchUsers(searchTerm, currentUser.id);
        setResults(foundUsers);
      } else {
        setResults([]);
      }
    });
  }, [searchTerm, currentUser]);

  // Fetch suggestions
  useEffect(() => {
    async function fetchSuggestions() {
      if (currentUser) {
        setLoadingSuggestions(true);
        try {
            const suggested = await getSuggestedUsers(currentUser.id);
            setSuggestions(suggested);
        } catch(error) {
            console.error("Failed to fetch suggestions:", error);
            toast({
                variant: "destructive",
                title: "Could not load suggestions",
                description: "There was an error finding suggestions for you."
            });
        } finally {
            setLoadingSuggestions(false);
        }
      }
    }
    fetchSuggestions();
  }, [currentUser, toast]);


  const handleInviteClick = async (user: User) => {
    if (!currentUser) return;
    setSelectedUser(user);
    setIsDialogOpen(true);
    setIsLoadingDialog(true);
    setSelectedCircleIds([]);
    setExistingMemberships([]);

    try {
      const circles = await getOwnedCirclesForUser(currentUser.id);
      setOwnedCircles(circles);

      if (circles.length > 0) {
        const circleIds = circles.map(c => c.id);
        const memberships = await getCircleMembershipsForUser(user.id, circleIds);
        setExistingMemberships(memberships);
      }
    } catch (error) {
      console.error("Error fetching dialog data:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load circle information." });
      setIsDialogOpen(false);
    } finally {
      setIsLoadingDialog(false);
    }
  };

  const handleSendInvite = async () => {
    if (!currentUser || !selectedUser || selectedCircleIds.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please select at least one circle." });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const invitePromises = selectedCircleIds.map(circleId => {
         const selectedCircle = ownedCircles.find(c => c.id === circleId);
         if (!selectedCircle) return Promise.resolve(); // Should not happen

         return sendInvite({
            fromUserId: currentUser.id,
            toUserId: selectedUser.id,
            circleId: circleId,
            circleName: selectedCircle.name,
          });
      });

      await Promise.all(invitePromises);

      toast({
        title: "Invites Sent!",
        description: `Invitations have been sent to ${selectedUser.displayName}.`,
      });
      setIsDialogOpen(false);

    } catch (error: any) {
      console.error("Error sending invites:", error);
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to send invites." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckboxChange = (circleId: string) => {
    setSelectedCircleIds(prev => 
      prev.includes(circleId) 
        ? prev.filter(id => id !== circleId)
        : [...prev, circleId]
    );
  };
  
  const showSuggestions = searchTerm.trim().length === 0;

  return (
    <>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Find Members
          </h1>
          <p className="text-muted-foreground">
            Search for other users on the platform to invite them to your circles.
          </p>
        </div>

        <div className="relative">
          <Input
            placeholder="Search by display name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-lg"
          />
           {isSearching && <LoaderCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />}
        </div>

        <div className="space-y-4 min-h-[200px]">
          {showSuggestions ? (
            <div>
              <h2 className="text-lg font-semibold mb-2 text-muted-foreground">Suggestions for you</h2>
              {loadingSuggestions ? (
                <div className="space-y-4">
                  <UserCardSkeleton />
                  <UserCardSkeleton />
                  <UserCardSkeleton />
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-4">
                    {suggestions.map((s) => (
                        <UserCard key={s.user.id} user={s.user} onInvite={handleInviteClick} suggestion={{viaUser: s.viaUser, viaCircle: s.viaCircle}} />
                    ))}
                </div>
              ) : (
                <p className="text-center py-10 text-muted-foreground">No suggestions right now. Invite more people to expand your network!</p>
              )}
            </div>
          ) : isSearching ? (
             <div className="flex justify-center items-center pt-10">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : results.length > 0 ? (
            results.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onInvite={handleInviteClick}
              />
            ))
          ) : searchTerm.trim().length > 1 ? (
            <div className="text-center py-10">
                <p className="text-muted-foreground">No users found with that name.</p>
            </div>
          ) : null}
        </div>

        <Card className="mt-8">
            <CardContent className="p-6 text-center">
                 <h3 className="text-lg font-medium">Can't find someone?</h3>
                 <p className="text-muted-foreground mt-1 mb-4 text-sm">
                    They might not be on the platform yet. Send them an invite to join!
                 </p>
                 <Button asChild>
                    <Link href="/invite">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite a friend to MirrorNet™
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite {selectedUser?.displayName} to Circles</DialogTitle>
            <DialogDescription>
              Select the circles you would like to invite them to. They will be notified to join your circle.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {isLoadingDialog ? (
              <div className="flex justify-center items-center h-24">
                <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : ownedCircles.length > 0 ? (
                ownedCircles.map((circle) => {
                  const isMember = existingMemberships.includes(circle.id);
                  return (
                    <div key={circle.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={circle.id}
                        checked={selectedCircleIds.includes(circle.id)}
                        onCheckedChange={() => handleCheckboxChange(circle.id)}
                        disabled={isSubmitting || isMember}
                      />
                      <Label
                        htmlFor={circle.id}
                        className={isMember ? "text-muted-foreground italic" : ""}
                      >
                        {circle.name} {isMember && "(Already a member)"}
                      </Label>
                    </div>
                  );
                })
            ) : (
                <p className="text-sm text-muted-foreground">You don't own any circles to invite users to.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendInvite} disabled={selectedCircleIds.length === 0 || isSubmitting || isLoadingDialog}>
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? "Sending..." : "Send Invites"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
