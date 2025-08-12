"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { submitFeedback } from "@/lib/data";
import { useRouter } from "next/navigation";
import { ChevronLeft, Send, MessageSquareQuote, LoaderCircle } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

export default function FeedbackPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const [designRating, setDesignRating] = useState("3");
  const [intuitivenessRating, setIntuitivenessRating] = useState("3");
  const [featureSatisfaction, setFeatureSatisfaction] = useState("3");
  const [performanceRating, setPerformanceRating] = useState("3");
  const [recommendLikelihood, setRecommendLikelihood] = useState("3");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to submit feedback." });
      return;
    }

    if (!comments.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please provide some comments." });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback({
        userId: user.id,
        designRating: parseInt(designRating),
        intuitivenessRating: parseInt(intuitivenessRating),
        featureSatisfaction: parseInt(featureSatisfaction),
        performanceRating: parseInt(performanceRating),
        recommendLikelihood: parseInt(recommendLikelihood),
        comments: comments,
      });

      toast({
        title: "Feedback Submitted!",
        description: "Thank you for helping us improve MirrorNet™.",
      });

      router.push(`/dashboard`);

    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to submit your feedback. Please try again."});
    } finally {
        setIsSubmitting(false);
    }
  };


  if (userLoading || !user) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Button variant="ghost" asChild>
        <Link href="/dashboard">
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <MessageSquareQuote className="h-12 w-12 text-primary" />
            <div>
              <CardTitle className="text-2xl font-headline">Share Your Feedback</CardTitle>
              <CardDescription>
                Your opinion helps us make MirrorNet™ better. Please rate the following aspects of the application.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid gap-3">
                <Label className="text-base font-medium">How would you rate the overall design and aesthetics of the app?</Label>
                <RadioGroup value={designRating} onValueChange={setDesignRating} className="flex gap-4" disabled={isSubmitting}>
                    {[1, 2, 3, 4, 5].map(value => ( <div key={value} className="flex flex-col items-center space-y-2"> <Label htmlFor={`design-${value}`} className="text-sm">{value}</Label> <RadioGroupItem value={String(value)} id={`design-${value}`} /> </div> ))}
                </RadioGroup>
                <div className="flex justify-between text-xs text-muted-foreground"> <span>Needs Improvement</span> <span>Excellent</span> </div>
            </div>

            <div className="grid gap-3">
                <Label className="text-base font-medium">How intuitive and easy to use do you find the application?</Label>
                <RadioGroup value={intuitivenessRating} onValueChange={setIntuitivenessRating} className="flex gap-4" disabled={isSubmitting}>
                     {[1, 2, 3, 4, 5].map(value => ( <div key={value} className="flex flex-col items-center space-y-2"> <Label htmlFor={`intuitive-${value}`} className="text-sm">{value}</Label> <RadioGroupItem value={String(value)} id={`intuitive-${value}`} /> </div> ))}
                </RadioGroup>
                <div className="flex justify-between text-xs text-muted-foreground"> <span>Confusing</span> <span>Very Intuitive</span> </div>
            </div>
            
            <div className="grid gap-3">
                <Label className="text-base font-medium">How satisfied are you with the current features available?</Label>
                <RadioGroup value={featureSatisfaction} onValueChange={setFeatureSatisfaction} className="flex gap-4" disabled={isSubmitting}>
                     {[1, 2, 3, 4, 5].map(value => ( <div key={value} className="flex flex-col items-center space-y-2"> <Label htmlFor={`features-${value}`} className="text-sm">{value}</Label> <RadioGroupItem value={String(value)} id={`features-${value}`} /> </div> ))}
                </RadioGroup>
                <div className="flex justify-between text-xs text-muted-foreground"> <span>Unsatisfied</span> <span>Very Satisfied</span> </div>
            </div>

            <div className="grid gap-3">
                <Label className="text-base font-medium">How would you rate the app's speed and performance?</Label>
                <RadioGroup value={performanceRating} onValueChange={setPerformanceRating} className="flex gap-4" disabled={isSubmitting}>
                     {[1, 2, 3, 4, 5].map(value => ( <div key={value} className="flex flex-col items-center space-y-2"> <Label htmlFor={`performance-${value}`} className="text-sm">{value}</Label> <RadioGroupItem value={String(value)} id={`performance-${value}`} /> </div> ))}
                </RadioGroup>
                <div className="flex justify-between text-xs text-muted-foreground"> <span>Slow</span> <span>Very Fast</span> </div>
            </div>

            <div className="grid gap-3">
                <Label className="text-base font-medium">How likely are you to recommend MirrorNet™ to a friend?</Label>
                <RadioGroup value={recommendLikelihood} onValueChange={setRecommendLikelihood} className="flex gap-4" disabled={isSubmitting}>
                     {[1, 2, 3, 4, 5].map(value => ( <div key={value} className="flex flex-col items-center space-y-2"> <Label htmlFor={`recommend-${value}`} className="text-sm">{value}</Label> <RadioGroupItem value={String(value)} id={`recommend-${value}`} /> </div> ))}
                </RadioGroup>
                <div className="flex justify-between text-xs text-muted-foreground"> <span>Not Likely</span> <span>Very Likely</span> </div>
            </div>

            <div className="grid gap-3">
                <Label htmlFor="comments" className="text-base font-medium">Do you have any other comments, suggestions, or issues to report?</Label>
                <Textarea id="comments" placeholder="Tell us what you think..." value={comments} onChange={e => setComments(e.target.value)} disabled={isSubmitting} rows={5} />
            </div>

        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
