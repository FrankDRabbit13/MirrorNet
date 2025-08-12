"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getFeedbackSubmissions, type Feedback } from "@/lib/data";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ShieldCheck, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function getRatingColor(rating: number) {
    if (rating <= 2) return "text-red-500";
    if (rating <= 3) return "text-yellow-500";
    return "text-green-500";
}

export default function FeedbackReviewPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push("/login");
      } else if (!user.isAdmin) {
        router.push("/dashboard");
      } else {
        const fetchFeedback = async () => {
          setLoading(true);
          const submissions = await getFeedbackSubmissions();
          setFeedbackList(submissions);
          setLoading(false);
        };
        fetchFeedback();
      }
    }
  }, [user, userLoading, router]);

  if (userLoading || loading || !user?.isAdmin) {
    return (
       <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Feedback Submissions
          </h1>
          <p className="text-muted-foreground">
            Reviewing user feedback...
          </p>
        </div>
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Feedback Submissions
          </h1>
          <p className="text-muted-foreground">
            Here's what users are saying about the app.
          </p>
        </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Design</TableHead>
                  <TableHead>Intuitiveness</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Recommend</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbackList.length > 0 ? (
                  feedbackList.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell>
                          {feedback.user && (
                              <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                      <AvatarImage src={feedback.user.photoUrl} />
                                      <AvatarFallback>{feedback.user.displayName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium whitespace-nowrap">{feedback.user.displayName}</span>
                              </div>
                          )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRatingColor(feedback.designRating)}>
                          {feedback.designRating} <Star className="w-3 h-3 ml-1 fill-current" />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRatingColor(feedback.intuitivenessRating)}>
                          {feedback.intuitivenessRating} <Star className="w-3 h-3 ml-1 fill-current" />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRatingColor(feedback.featureSatisfaction)}>
                          {feedback.featureSatisfaction} <Star className="w-3 h-3 ml-1 fill-current" />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRatingColor(feedback.performanceRating)}>
                          {feedback.performanceRating} <Star className="w-3 h-3 ml-1 fill-current" />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRatingColor(feedback.recommendLikelihood)}>
                          {feedback.recommendLikelihood} <Star className="w-3 h-3 ml-1 fill-current" />
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-[250px]">
                          <p className="text-muted-foreground text-sm">{feedback.comments}</p>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(feedback.createdAt.toDate(), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No feedback submitted yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
