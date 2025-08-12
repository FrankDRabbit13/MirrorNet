"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCircleById, getUserById, type Circle, type User, traitDefinitions } from "@/lib/data";
import { notFound, useRouter, useParams } from "next/navigation";
import { ChevronLeft, Send } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { collection, serverTimestamp, query, where, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function EvaluatePage() {
  const params = useParams();
  const circleId = params.circleId as string;
  const userId = params.userId as string;

  const { user: currentUser } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [circle, setCircle] = useState<Circle | null>(null);
  const [userToRate, setUserToRate] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!circleId || !userId || !currentUser) return;

      setLoading(true);
      const [fetchedCircle, fetchedUser] = await Promise.all([
        getCircleById(circleId, currentUser.id), // Pass currentUser.id here
        getUserById(userId),
      ]);

      if (fetchedCircle) {
        setCircle(fetchedCircle);
        // Ensure user to rate is actually a member of the current user's circle
        const isMember = fetchedCircle.memberIds.includes(userId);
        if (!isMember) {
            toast({ variant: "destructive", title: "Not a member", description: "You can only rate members of your circle." });
            notFound();
            return;
        }

        if (fetchedCircle.traits) {
            const initialRatings = fetchedCircle.traits.reduce((acc, trait) => {
              acc[trait.name] = 5;
              return acc;
            }, {} as Record<string, number>);
            setRatings(initialRatings);
        }
      }
      
      if (fetchedUser) {
        setUserToRate(fetchedUser);
      }

      if (!fetchedCircle || !fetchedUser) {
        notFound();
      }
      setLoading(false);
    };
    fetchData();
  }, [circleId, userId, currentUser, toast]);

  const handleRatingChange = (traitName: string, value: number[]) => {
    setRatings((prevRatings) => ({
      ...prevRatings,
      [traitName]: value[0],
    }));
  };
  
  const handleSubmit = async () => {
    if (!currentUser || !userToRate || !circle) {
      toast({ variant: "destructive", title: "Error", description: "Could not submit rating. Missing user or circle information." });
      return;
    }

    setIsSubmitting(true);
    try {
      // "Upsert" logic: Check if a rating already exists.
      const ratingsRef = collection(db, "ratings");
      const q = query(ratingsRef, 
        where("fromUserId", "==", currentUser.id),
        where("toUserId", "==", userToRate.id),
        where("circleName", "==", circle.name)
      );
      
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);

      if (querySnapshot.empty) {
        // No existing rating, create a new one.
        const newRatingRef = doc(ratingsRef);
        batch.set(newRatingRef, {
          fromUserId: currentUser.id,
          toUserId: userToRate.id,
          circleId: circle.id, // Keep for reference, but don't query by it for scoring
          circleName: circle.name, // Use circleName for querying scores
          ratings: ratings,
          createdAt: serverTimestamp(),
        });
      } else {
        // Existing rating found, update it.
        const existingRatingDoc = querySnapshot.docs[0];
        batch.update(existingRatingDoc.ref, {
          ratings: ratings,
          updatedAt: serverTimestamp(), // Keep track of updates
        });
      }

      await batch.commit();

      toast({
        title: "Rating Submitted!",
        description: `Your feedback for ${userToRate.displayName} has been recorded.`,
      });

      router.push(`/circles/${circleId}`);

    } catch (error) {
      console.error("Error submitting rating:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to submit rating. Please try again."});
    } finally {
        setIsSubmitting(false);
    }
  };


  if (loading || !circle || !userToRate) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Button variant="ghost" asChild>
        <Link href={`/circles/${circleId}`}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to {circle.name} Circle
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userToRate.photoUrl} alt={userToRate.displayName} />
              <AvatarFallback>{userToRate.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-headline">Rate {userToRate.displayName}</CardTitle>
              <CardDescription>
                Provide your anonymous feedback for the current cycle. Rate from 1 to 10.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-4">
          {circle.traits.map((trait) => (
            <div key={trait.name} className="grid gap-2">
              <div className="flex justify-between items-center">
                <div>
                    <Label htmlFor={trait.name} className="text-base font-medium">
                      {trait.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{traitDefinitions[trait.name]}</p>
                </div>
                <span className="font-bold text-lg text-primary w-10 text-center">
                  {ratings[trait.name]}
                </span>
              </div>
              <Slider
                id={trait.name}
                value={[ratings[trait.name] || 5]}
                onValueChange={(value) => handleRatingChange(trait.name, value)}
                min={1}
                max={10}
                step={1}
                disabled={isSubmitting}
              />
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
