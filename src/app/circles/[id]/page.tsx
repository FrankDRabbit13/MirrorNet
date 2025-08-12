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
                <Select on
