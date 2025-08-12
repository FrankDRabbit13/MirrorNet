"use client";

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
import { getCirclesForUser, getAttractionScoresForUser, type Circle, type TraitScore, type User, traitDefinitions, type AttractionRating, familyGoalTraits, sendFamilyGoal, searchUsers } from "@/lib/data";
import { ArrowRight, Plus, Users, Star, Heart, Briefcase, Globe, HandHeart, Shield, Handshake, ThumbsUp, PartyPopper, LifeBuoy, Smile, KeyRound, Brain, Eye, Clock, FolderKanban, UsersRound, Search, Sparkles, LoaderCircle, Leaf, Flame, HeartHandshake, Lightbulb, UserCheck, Gem, Send, Lock } from "lucide-react";
import { AnimatedCountup } from "@/components/animated-countup";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { summarizeTraits } from "@/ai/flows/summarize-traits";
import type { SummarizeTraitsOutput } from "@/ai/schemas";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";


const circleIcons: Record<string, React.ReactNode> = {
  Friends: <Users className="w-6 h-6 text-accent" />,
  Family: <Heart className="w-6 h-6 text-accent" />,
  Work: <Briefcase className="w-6 h-6 text-accent" />,
  General: <Globe className="w-6 h-6 text-accent" />,
  "Eco Rating": <Leaf className="w-6 h-6 text-accent" />,
  "Attraction": <Heart className="w-6 h-6 text-accent" />,
};

const traitIcons: Record<string, React.ReactNode> = {
  // Family
  "Caring": <HandHeart className="w-4 h-4" />,
  "Respectful": <Handshake className="w-4 h-4" />,
  "Dependable": <Shield className="w-4 h-4" />,
  "Loving": <Heart className="w-4 h-4" />,
  "Protective": <Shield className="w-4 h-4" />,
  // Work
  "Professional": <Briefcase className="w-4 h-4" />,
  "Reliable": <ThumbsUp className="w-4 h-4" />,
  "Organized": <FolderKanban className="w-4 h-4" />,
  "Collaborative": <UsersRound className="w-4 h-4" />,
  "Punctual": <Clock className="w-4 h-4" />,
  // Friends
  "Loyal": <Shield className="w-4 h-4" />,
  "Honest": <Handshake className="w-4 h-4" />,
  "Fun": <PartyPopper className="w-4 h-4" />,
  "Supportive": <LifeBuoy className="w-4 h-4" />,
  "Encouraging": <ThumbsUp className="w-4 h-4" />,
  // General
  "Polite": <Smile className="w-4 h-4" />,
  "Friendly": <Smile className="w-4 h-4" />,
  "Trustworthy": <KeyRound className="w-4 h-4" />,
  "Open-minded": <Brain className="w-4 h-4" />,
  "Observant": <Eye className="w-4 h-4" />,
  // Eco Rating
  "Energy": <Sparkles className="w-4 h-4" />,
  "Waste": <Globe className="w-4 h-4" />,
  "Transport": <Briefcase className="w-4 h-4" />,
  "Consumption": <UsersRound className="w-4 h-4" />,
  "Water": <Heart className="w-4 h-4" />,
  // Romantic & Attraction
  "Charming": <HeartHandshake className="w-4 h-4" />,
  "Witty": <Lightbulb className="w-4 h-4" />,
  "Passionate": <Flame className="w-4 h-4" />,
  "Good-looking": <UserCheck className="w-4 h-4" />,
  "Authenticity": <UserCheck className="w-4 h-4" />,
  "Default": <Star className="w-4 h-4" />,
};

const getScoreColor = (score: number) => {
    if (score === 0) return 'text-muted-foreground';
    const hue = (score / 10) * 120; // 0 is red, 120 is green
    return `hsl(${hue}, 80%, 45%)`;
};


function TraitCard({ name, score }: { name: string; score: number }) {
  const { resolvedTheme } = useTheme();
  const [indicatorColor, setIndicatorColor] = useState<string | undefined>();
  
  useEffect(() => {
    const hue = (score / 10) * 120;
    const indicatorColorLight = `hsl(${hue}, 90%, 90%)`;
    const indicatorColorDark = `hsla(${hue}, 60%, 30%, 0.4)`;
    setIndicatorColor(resolvedTheme === 'dark' ? indicatorColorDark : indicatorColorLight);
  }, [score, resolvedTheme]);

  const icon = traitIcons[name] || traitIcons["Default"];
  const scoreColor = getScoreColor(score);

  return (
    <div className="relative p-3 bg-secondary/30 dark:bg-secondary/50 rounded-lg overflow-hidden">
      {indicatorColor && (
        <Progress 
          value={(score/10) * 100} 
          className="absolute top-0 left-0 h-full w-full rounded-lg border-0 bg-transparent"
          style={{ '--indicator-color': indicatorColor } as React.CSSProperties}
          indicatorClassName="bg-[--indicator-color] transition-all duration-500"
        />
      )}
      <div className="relative flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-card-foreground">
            {icon}
            <p className="font-medium text-sm">{name}</p>
        </div>
        <div className="flex items-center gap-2">
          <AnimatedCountup 
            value={score} 
            className="font-bold text-lg" 
            style={{ color: scoreColor }}
          />
        </div>
      </div>
    </div>
  );
}

function CircleCard({ circle, user, onAnalyze, onSuggestGoal }: { circle: Circle; user: User; onAnalyze: (circleName: string, traits: TraitScore[]) => void; onSuggestGoal: () => void; }) {
  
  const isFamilyCircle = circle.name === "Family";
  const familyScores = user.familyScores || [];
  
  const traitsToDisplay = isFamilyCircle ? familyScores : circle.traits;

  const overallAverage = traitsToDisplay.length > 0
    ? traitsToDisplay.reduce((sum, trait) => sum + trait.averageScore, 0) / traitsToDisplay.length
    : 0;
  
  const averageScoreBgColor = getScoreColor(overallAverage);

  const isPrivacyProtectedCircle = ["Work", "Friends", "General"].includes(circle.name);
  const needsMoreMembers = isPrivacyProtectedCircle && circle.memberIds.length < 4;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {circleIcons[circle.name]}
              <div>
                <CardTitle className="font-headline">{circle.name}</CardTitle>
                <CardDescription>{circle.members.length} members</CardDescription>
              </div>
            </div>
            {overallAverage > 0 && !needsMoreMembers && (
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-primary-foreground transition-colors duration-500"
                  style={{ backgroundColor: averageScoreBgColor }}
                >
                    <AnimatedCountup value={overallAverage} className="font-bold text-2xl" />
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        {needsMoreMembers ? (
           <div className="flex flex-col h-full">
             <div className="text-center mb-4">
                <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-card-foreground">Anonymity Protected</p>
                <p className="text-sm text-muted-foreground">
                  You need at least {4 - circle.memberIds.length} more member(s) to see your scores.
                </p>
             </div>
              <div className="space-y-2">
                 <p className="text-xs font-semibold text-muted-foreground uppercase text-center">TRAITS IN THIS CIRCLE</p>
                 {traitsToDisplay.map((trait) => (
                    <div key={trait.name} className="flex items-center gap-2 p-2 bg-secondary/30 dark:bg-secondary/50 rounded-lg">
                        {traitIcons[trait.name] || traitIcons["Default"]}
                        <p className="font-medium text-sm text-muted-foreground">{trait.name}</p>
                    </div>
                 ))}
              </div>
           </div>
        ) : traitsToDisplay.length > 0 ? (
          traitsToDisplay.map((trait) => (
            <TraitCard 
              key={trait.name} 
              name={trait.name} 
              score={trait.averageScore}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center pt-4">
            {isFamilyCircle
                ? "You haven't completed your Family self-assessment yet."
                : "No trait scores yet. Once members rate you, your scores will appear here."}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2 pt-6">
        {isFamilyCircle ? (
          <div className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href={`/circles/${circle.id}`}>View Details</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/family-assessment">
                {familyScores.length > 0 ? "Update" : "Assess"}
              </Link>
            </Button>
          </div>
        ) : (
          <Button asChild>
            <Link href={`/circles/${circle.id}`}>
              View Details <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}

        {isFamilyCircle && user.isPremium && (
             <Button variant="secondary" onClick={onSuggestGoal}>
                <HeartHandshake className="mr-2 h-4 w-4" /> Suggest a Goal
             </Button>
        )}
        {isFamilyCircle && !user.isPremium && (
            <Button asChild variant="secondary">
              <Link href="/premium">
                <Gem className="mr-2 h-4 w-4" /> Go Premium to Suggest a Goal
              </Link>
            </Button>
        )}
        <Button variant="secondary" onClick={() => onAnalyze(circle.name, traitsToDisplay)} disabled={needsMoreMembers}>
          <Sparkles className="mr-2 h-4 w-4" />
          Analysis
        </Button>
      </CardFooter>
    </Card>
  );
}

function EcoRatingCard({ user, onAnalyze }: { user: User; onAnalyze: (circleName: string, traits: TraitScore[]) => void; }) {
  const ecoTraits = user.ecoScores || [];
  const overallAverage = ecoTraits.length > 0
    ? ecoTraits.reduce((sum, trait) => sum + trait.averageScore, 0) / ecoTraits.length
    : 0;
  
  const averageScoreBgColor = getScoreColor(overallAverage);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {circleIcons["Eco Rating"]}
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="font-headline">Eco Rating</CardTitle>
                  <Badge variant="outline">Beta</Badge>
                </div>
                <CardDescription>Your green profile</CardDescription>
              </div>
            </div>
            {overallAverage > 0 && (
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-primary-foreground transition-colors duration-500"
                  style={{ backgroundColor: averageScoreBgColor }}
                >
                    <AnimatedCountup value={overallAverage} className="font-bold text-2xl" />
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        {ecoTraits.length > 0 ? ecoTraits.map((trait) => (
          <TraitCard 
            key={trait.name} 
            name={trait.name} 
            score={trait.averageScore}
          />
        )) : (
          <p className="text-sm text-muted-foreground text-center pt-4">
            You haven't completed your Eco Rating yet. Complete the assessment to see your scores.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2 pt-6">
        <Button asChild>
          <Link href="/eco-rating">
            {ecoTraits.length > 0 ? "Update Assessment" : "Start Assessment"} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="secondary" onClick={() => onAnalyze("Eco Rating", ecoTraits)}>
          <Sparkles className="mr-2 h-4 w-4" />
          Analysis
        </Button>
      </CardFooter>
    </Card>
  )
}

function AttractionCard({ user, ratingsCount, onRateAttraction }: { user: User; ratingsCount: number; onRateAttraction: () => void; }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {circleIcons["Attraction"]}
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="font-headline">Attraction</CardTitle>
                   <Badge variant="premium"><Gem className="w-3 h-3 mr-1"/>Premium</Badge>
                </div>
                <CardDescription>Your secret fans</CardDescription>
              </div>
            </div>
             {ratingsCount > 0 && (
                <div className="text-center">
                  <p className={cn("font-bold text-3xl text-primary", !user.isPremium && "blur-md")}>{ratingsCount}</p>
                  <p className="text-xs text-muted-foreground">Ratings Received</p>
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow relative flex items-center justify-center">
         <div className="text-center">
            {ratingsCount > 0 ? (
                <>
                 <p className="text-muted-foreground">
                   {user.isPremium ? "You have received attraction ratings. You can now view your scores." : "You have received attraction ratings."}
                 </p>
                 {!user.isPremium && <p className="text-sm text-muted-foreground">Upgrade to Premium to view your scores.</p>}
                </>
            ) : (
                <p className="text-sm text-muted-foreground">No one has rated you for attraction yet.</p>
            )}
        </div>
        {!user.isPremium && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-sm rounded-lg">
             <div className="text-center p-4">
                <p className="text-lg font-semibold text-card-foreground">See how others rate you</p>
                <p className="text-sm text-muted-foreground mt-1">
                    Become a premium member to view your attractiveness scores.
                </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2 pt-6">
        <Button onClick={onRateAttraction}>
            <Sparkles className="mr-2 h-4 w-4" /> Rate for Attraction
        </Button>
        {user.isPremium ? (
          <Button asChild variant="secondary" disabled={ratingsCount === 0}>
            <Link href="/attraction-ratings">
              View All Ratings <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
           <Button asChild variant="secondary">
              <Link href="/premium">
                <Gem className="mr-2 h-4 w-4" /> Go Premium to View
              </Link>
            </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
         <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-2 pt-6">
                <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-10 w-full" />
            </CardFooter>
         </Card>
      ))}
    </div>
  )
}

function AnalysisDialog({ isOpen, setIsOpen, analysis, isLoading, circleName }: { isOpen: boolean, setIsOpen: (open: boolean) => void, analysis: SummarizeTraitsOutput | null, isLoading: boolean, circleName: string }) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Analysis for {circleName}
          </DialogTitle>
          <DialogDescription>
            Here's a summary of your feedback.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-4 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-1/3 mt-4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : analysis ? (
          <div className="py-4 space-y-4 text-sm">
            <p className="text-muted-foreground">{analysis.summary}</p>

            {analysis.strengths.length > 0 && (
              <div>
                <h4 className="font-semibold text-card-foreground">Key Strengths:</h4>
                <ul className="list-disc list-inside text-muted-foreground">
                  {analysis.strengths.map((strength, i) => <li key={i}>{strength}</li>)}
                </ul>
              </div>
            )}

            {analysis.opportunities.length > 0 && (
              <div>
                <h4 className="font-semibold text-card-foreground">Growth Opportunities:</h4>
                 <ul className="list-disc list-inside text-muted-foreground">
                  {analysis.opportunities.map((opp, i) => <li key={i}>{opp}</li>)}
                </ul>
              </div>
            )}

          </div>
        ) : (
          <p>Could not load analysis.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GoalDialog({ isOpen, setIsOpen, familyMembers, onSend }: { isOpen: boolean; setIsOpen: (open: boolean) => void; familyMembers: User[], onSend: (memberId: string, trait: string) => Promise<void> }) {
    const [selectedMemberId, setSelectedMemberId] = useState("");
    const [selectedTrait, setSelectedTrait] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSend = async () => {
        if (!selectedMemberId || !selectedTrait) return;
        setIsSubmitting(true);
        await onSend(selectedMemberId, selectedTrait);
        setIsSubmitting(false);
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Suggest a Goal to a Family Member</DialogTitle>
                    <DialogDescription>
                    Choose a family member and a trait for you both to focus on. They will need to accept your suggestion.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Select onValueChange={setSelectedMemberId} value={selectedMemberId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a family member" />
                        </SelectTrigger>
                        <SelectContent>
                            {familyMembers.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                    {member.displayName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
                    <Button onClick={handleSend} disabled={!selectedTrait || !selectedMemberId || isSubmitting}>
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Sending..." : "Send Suggestion"}
                    </Button>
                </DialogFooter>
            </DialogContent>
      </Dialog>
    )
}

function RateAttractionDialog({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void; }) {
    const { user: currentUser } = useUser();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState<User[]>([]);
    const [isSearching, startSearchTransition] = useTransition();

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm("");
            setResults([]);
        }
    }, [isOpen]);

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

    const handleRateClick = (userId: string) => {
        router.push(`/rate-attraction/${userId}`);
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Rate a User for Attraction</DialogTitle>
                    <DialogDescription>
                    Search for any user on the platform to give them an attraction rating.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="relative">
                        <Input
                            placeholder="Search by display name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="text-base"
                        />
                        {isSearching && <LoaderCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />}
                    </div>
                     <div className="space-y-2 min-h-[150px] max-h-[300px] overflow-y-auto pr-2">
                         {results.length > 0 ? (
                            results.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-2 hover:bg-secondary rounded-md">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.photoUrl} />
                                            <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                         <div className="flex items-center gap-2">
                                            <p className="font-medium">{user.displayName}</p>
                                            {user.isPremium && <Gem className="w-4 h-4 text-primary" />}
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={() => handleRateClick(user.id)}>
                                        <Sparkles className="mr-2 h-4 w-4" /> Rate
                                    </Button>
                                </div>
                            ))
                         ) : searchTerm.trim().length > 1 && !isSearching ? (
                             <div className="text-center py-10">
                                <p className="text-muted-foreground">No users found with that name.</p>
                            </div>
                         ) : null}
                     </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SummarizeTraitsOutput | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [selectedCircleName, setSelectedCircleName] = useState("");
  const [attractionRatingsCount, setAttractionRatingsCount] = useState(0);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isRateAttractionOpen, setIsRateAttractionOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const userCircles = await getCirclesForUser(user.id);
        setCircles(userCircles);

        const { ratings } = await getAttractionScoresForUser(user.id);
        setAttractionRatingsCount(ratings.length);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load your dashboard data.",
        });
      } finally {
        setLoading(false);
      }
    }
  }, [user, toast]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchDashboardData();
    }
  }, [user, userLoading, router, fetchDashboardData]);

  const handleAnalyze = async (circleName: string, traits: TraitScore[]) => {
    setSelectedCircleName(circleName);
    setIsAnalysisOpen(true);
    setAnalysisLoading(true);
    setAnalysisResult(null);
    try {
        const result = await summarizeTraits({ circleName, traits });
        setAnalysisResult(result);
    } catch (error: any) {
        console.error("Error getting analysis:", error);
        // This provides a more helpful message when the API key is the likely issue.
        const description = error.message.includes("Could not fetch GEMINI_API_KEY")
          ? "The AI analysis feature is not configured correctly. The GEMINI_API_KEY is missing from the server environment."
          : error.message;
        toast({ variant: "destructive", title: "Analysis Failed", description });
        setIsAnalysisOpen(false);
    } finally {
        setAnalysisLoading(false);
    }
  }

  const handleOpenGoalDialog = () => {
    setIsGoalDialogOpen(true);
  }

  const handleSendGoal = async (memberId: string, trait: string) => {
    if (!user) return;
    try {
      await sendFamilyGoal(user.id, memberId, trait);
      const targetUser = familyCircle?.members.find(m => m.id === memberId);
      toast({
        title: "Suggestion Sent!",
        description: `Your goal suggestion has been sent to ${targetUser?.displayName}.`,
      });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Could not send suggestion."
        });
    }
  }

  const handleOpenRateAttraction = () => {
    setIsRateAttractionOpen(true);
  };

  const circleOrder = ["Family", "Friends", "Work", "General"];
  const sortedCircles = [...circles].sort((a, b) => {
    const aIndex = circleOrder.indexOf(a.name);
    const bIndex = circleOrder.indexOf(b.name);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const familyCircle = circles.find(c => c.name === "Family");
  const familyMembers = familyCircle ? familyCircle.members.filter(m => m.id !== user?.id) : [];

  if (userLoading || loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return null;
  }
  
  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">
            Welcome back, {user.displayName}!
          </h1>
          <p className="text-muted-foreground">
            Here is your self-awareness dashboard.
          </p>
        </div>
        <Button asChild>
          <Link href="/search">
            <Search className="mr-2 h-4 w-4" />
            Find Members
          </Link>
        </Button>
      </div>
      
      {circles.length > 0 || user ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedCircles.map((circle) => (
            <CircleCard key={circle.id} circle={circle} user={user} onAnalyze={handleAnalyze} onSuggestGoal={handleOpenGoalDialog} />
          ))}
          <EcoRatingCard user={user} onAnalyze={handleAnalyze} />
          <AttractionCard user={user} ratingsCount={attractionRatingsCount} onRateAttraction={handleOpenRateAttraction} />
        </div>
      ) : (
        <Card className="text-center py-12">
           <CardContent>
              <h3 className="text-xl font-semibold">No circles yet!</h3>
              <p className="text-muted-foreground mt-2">
                Get started by searching for other users and inviting them to a circle.
              </p>
               <Button asChild className="mt-4">
                 <Link href="/search">
                    <Search className="mr-2 h-4 w-4" />
                    Find Members
                 </Link>
               </Button>
           </CardContent>
        </Card>
      )}
    </div>

    <AnalysisDialog 
      isOpen={isAnalysisOpen}
      setIsOpen={setIsAnalysisOpen}
      analysis={analysisResult}
      isLoading={analysisLoading}
      circleName={selectedCircleName}
    />

    <RateAttractionDialog
        isOpen={isRateAttractionOpen}
        setIsOpen={setIsRateAttractionOpen}
    />

    {user.isPremium && familyMembers.length > 0 && (
        <GoalDialog 
            isOpen={isGoalDialogOpen}
            setIsOpen={setIsGoalDialogOpen}
            familyMembers={familyMembers}
            onSend={handleSendGoal}
        />
    )}
    </>
  );
}
