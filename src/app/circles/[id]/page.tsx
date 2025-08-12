"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCircleById, removeUserFromCircle, type User, type Circle, type RatingCycle, familyGoalTraits, sendFamilyGoal } from "@/lib/data";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { notFound, useRouter, useParams } from "next/navigation";
import { ChevronLeft, Edit, UserX, RefreshCw, Gem, Sparkles, HeartHandshake } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import { Send } from "lucide-react";

function MemberListItem({
  member,
  circle,
  currentUserId,
  onRemove,
  lastRatedAt,
  onSuggestGoal,
}: {
  member: User;
  circle: Circle;
  currentUserId: string;
  onRemove: (member: User) => void;
  lastRatedAt: Timestamp | null;
  onSuggestGoal: (member: User) => void;
}) {
  const { user: currentUser } = useUser();
  const isCurrentUser = member.id === currentUserId;
  const isCircleOwner = circle.ownerId === currentUserId;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between p-3 hover:bg-secondary rounded-lg transition-colors gap-3">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={member.photoUrl} alt={member.displayName} />
          <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2">
            <p className="font-medium">{member.displayName}</p>
            {member.isPremium && <Gem className="w-4 h-4 text-primary" />}
        </div>
      </div>
      {!isCurrentUser && (
        <div className="flex items-center gap-2 self-end sm:self-center">
           {lastRatedAt && circle.name !== "Family" && (
            <p className="text-xs text-muted-foreground italic">
              Rated {formatDistanceToNow(lastRatedAt.toDate(), { addSuffix: true })}
            </p>
          )}

          {circle.name !== "Family" && (
             <Button asChild size="sm" variant={lastRatedAt ? 'outline' : 'default'}>
                <Link href={`/evaluate/${circle.id}/${member.id}`}>
                {lastRatedAt ? (
                    <RefreshCw className="mr-2 h-4 w-4" />
                ) : (
                    <Edit className="mr-2 h-4 w-4" />
                )}
                {lastRatedAt ? 'Re-rate' : 'Rate'}
                </Link>
            </Button>
          )}
          
          {circle.name === "Family" && currentUser?.isPremium && (
             <Button size="sm" onClick={() => onSuggestGoal(member)}>
                <HeartHandshake className="mr-2 h-4 w-4" /> Suggest Goal
             </Button>
          )}

          {isCircleOwner && (
            <Button variant="destructive" size="sm" onClick={() => onRemove(member)}>
              <UserX className="mr-2 h-4 w-4" /> Remove
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function GoalDialog({ isOpen, setIsOpen, targetUser, onSend }: { isOpen: boolean; setIsOpen: (open: boolean) => void; targetUser: User | null, onSend: (trait: string) => Promise<void> }) {
    const [selectedTrait, setSelectedTrait] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSend = async () => {
        if (!selectedTrait) return;
        setIsSubmitting(true);
        await onSend(selectedTrait);
        setIsSubmitting(false);
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Suggest a Goal to {targetUser?.displayName}</DialogTitle>
                <DialogDescription>
                Choose a trait for you both to focus on for the next 30 days. They will need to accept your suggestion.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Select onValueChange={setSelectedTrait} value={selectedTrait}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a goal trait" />
                </SelectTrigger>
                <SelectContent>
                    {familyGoalTraits.map((trait) => (
                    <SelectItem key={trait} value={trait}>
                        {trait}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleSend} disabled={!selectedTrait || isSubmitting}>
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "Sending..." : "Send Suggestion"}
                </Button>
            </DialogFooter>
            </DialogContent>
      </Dialog>
    )
}

export default function CircleDetailsPage() {
  const params = useParams();
  const circleId = params.id as string;

  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ name: string; total: number }[]>([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<User | null>(null);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [goalTargetUser, setGoalTargetUser] = useState<User | null>(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const processRatingCycles = (cycles: RatingCycle[]) => {
      const data = cycles.map(cycle => ({
          name: format(cycle.date, "MMM yyyy"), // e.g., "Jul 2025"
          total: cycle.averageScore,
      }));
      setChartData(data);
  }

  const fetchCircle = async () => {
    if (!user) return;
    setLoading(true);
    const fetchedCircle = await getCircleById(circleId, user.id);
    if (fetchedCircle) {
      setCircle(fetchedCircle);
      if (fetchedCircle.historicalRatings) {
        processRatingCycles(fetchedCircle.historicalRatings);
      }
    } else {
      // If the circle is not found or user is not the owner, redirect.
      notFound();
    }
    setLoading(false);
  };

  useEffect(() => {
    if (circleId && user) {
        fetchCircle();
    }
  }, [circleId, user]);

  const handleOpenRemoveDialog = (member: User) => {
    setUserToRemove(member);
    setIsAlertOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!userToRemove || !circle || !user) return;

    if (circle.ownerId !== user.id) {
       toast({
        variant: "destructive",
        title: "Unauthorized",
        description: "Only the circle owner can remove members.",
      });
      return;
    }

    try {
      await removeUserFromCircle(user.id, userToRemove.id, circle.id);
      
      toast({
        title: "Member Removed",
        description: `${userToRemove.displayName} has been removed from the circle.`,
      });

      fetchCircle();

    } catch (error) {
      console.error("Error removing member:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove member. Please try again.",
      });
    } finally {
      setIsAlertOpen(false);
      setUserToRemove(null);
    }
  };

  const handleOpenGoalDialog = (member: User) => {
    setGoalTargetUser(member);
    setIsGoalDialogOpen(true);
  }

  const handleSendGoal = async (trait: string) => {
    if (!user || !goalTargetUser) return;
    try {
      await sendFamilyGoal(user.id, goalTargetUser.id, trait);
      toast({
        title: "Suggestion Sent!",
        description: `Your goal suggestion has been sent to ${goalTargetUser.displayName}.`,
      });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Could not send suggestion."
        });
    }
  }


  if (loading || userLoading || !circle || !user) {
    return <div>Loading...</div>; // Or a proper loading skeleton
  }

  const isMember = circle.memberIds.includes(user.id);
  if (!isMember) {
    notFound();
    return null;
  }

  const pageDescription = circle.name === "Family"
    ? "Family is for connection. Suggest a shared growth goal to a member."
    : "Rate members and view historical results.";

  return (
    <>
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/dashboard">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          {circle.name} Circle
        </h1>
        <p className="text-muted-foreground">{pageDescription}</p>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          {circle.name !== "Family" && <TabsTrigger value="results">Results</TabsTrigger>}
        </TabsList>
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Circle Members</CardTitle>
              <CardDescription>
                {circle.name === "Family" 
                  ? "Interact with your family members."
                  : "Select a member to provide your rating for the current cycle."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {circle.members.map((member) => (
                <MemberListItem
                  key={member.id}
                  member={member}
                  circle={circle}
                  currentUserId={user.id}
                  onRemove={handleOpenRemoveDialog}
                  lastRatedAt={circle.myRatings?.[member.id] ?? null}
                  onSuggestGoal={handleOpenGoalDialog}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Results Over Time</CardTitle>
              <CardDescription>
                Your average score across past cycles.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                      domain={[0, 10]}
                    />
                    <Bar
                      dataKey="total"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px]">
                  <p className="text-muted-foreground">No results yet. Once members rate you, your historical scores will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>

    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove{" "}
            <span className="font-semibold">{userToRemove?.displayName}</span>{" "}
            from your {circle.name} circle. You will also be removed from their circle. All ratings between you will be deleted. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmRemove}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <GoalDialog 
        isOpen={isGoalDialogOpen}
        setIsOpen={setIsGoalDialogOpen}
        targetUser={goalTargetUser}
        onSend={handleSendGoal}
    />
    </>
  );
}
