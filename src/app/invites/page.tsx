"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getSentInvitesForUser,
  getReceivedInvitesForUser,
  updateInviteStatus,
  findOrCreateCircleForUser,
  type Invite,
} from "@/lib/data";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { writeBatch, doc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";

function SentInvitesTable({ invites, loading }: { invites: Invite[], loading: boolean}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Invited</TableHead>
                    <TableHead>Circle</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            Loading invites...
                        </TableCell>
                    </TableRow>
                ) : invites.length > 0 ? (
                    invites.map((invite) => (
                        <TableRow key={invite.id}>
                            <TableCell className="font-medium">{invite.toUser?.displayName || invite.toEmail}</TableCell>
                            <TableCell>{invite.circleName || "Platform Invite"}</TableCell>
                            <TableCell>
                                <Badge variant="secondary">{invite.status}</Badge>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            No pending invites.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

function ReceivedInvitesTable({ invites, loading, onAction }: { invites: Invite[], loading: boolean, onAction: () => void }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});

  const handleAccept = async (invite: Invite) => {
    if (!invite.circleId || !invite.toUserId || !invite.fromUserId || !invite.circleName) {
        toast({ variant: "destructive", title: "Error", description: "This invite is invalid and cannot be accepted."});
        return;
    }

    setIsSubmitting(prev => ({...prev, [invite.id]: true}));
    try {
        const recipientCircleId = await findOrCreateCircleForUser(invite.toUserId, invite.circleName);
        if (!recipientCircleId) {
            throw new Error(`Could not find or create circle "${invite.circleName}" for you.`);
        }
        
        const batch = writeBatch(db);
        const recipientCircleRef = doc(db, 'circles', recipientCircleId);
        batch.update(recipientCircleRef, { memberIds: arrayUnion(invite.fromUserId) });

        const inviterCircleRef = doc(db, 'circles', invite.circleId);
        batch.update(inviterCircleRef, { memberIds: arrayUnion(invite.toUserId) });
       
        const inviteRef = doc(db, 'invites', invite.id);
        batch.update(inviteRef, { status: "accepted" });

        await batch.commit();

        toast({ title: "Invite Accepted!", description: `You and ${invite.fromUser?.displayName} are now connected in your ${invite.circleName} circles.` });
        onAction();
    } catch (error) {
        console.error("Error accepting invite:", error);
        toast({ 
            variant: "destructive", 
            title: "Error Accepting Invite", 
            description: "Failed to accept invite. Please try again or contact support if the problem persists."
        });
    } finally {
        setIsSubmitting(prev => ({...prev, [invite.id]: false}));
    }
  }
  
  const handleDecline = async (invite: Invite) => {
    setIsSubmitting(prev => ({...prev, [invite.id]: true}));
    try {
        await updateInviteStatus(invite.id, "declined");
        toast({ title: "Invite Declined"});
        onAction();
    } catch (error) {
        console.error("Error declining invite:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to decline invite."});
    } finally {
        setIsSubmitting(prev => ({...prev, [invite.id]: false}));
    }
  }


    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>Circle</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            Loading invites...
                        </TableCell>
                    </TableRow>
                ) : invites.length > 0 ? (
                    invites.map((invite) => (
                        <TableRow key={invite.id}>
                            <TableCell className="font-medium">{invite.fromUser?.displayName || 'A user'}</TableCell>
                            <TableCell>{invite.circleName}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleAccept(invite)} disabled={isSubmitting[invite.id]}>Accept</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDecline(invite)} disabled={isSubmitting[invite.id]}>Decline</Button>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            No pending circle invites.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

export default function InvitesPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [sentInvites, setSentInvites] = useState<Invite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<Invite[]>([]);
  const [loadingSent, setLoadingSent] = useState(true);
  const [loadingReceived, setLoadingReceived] = useState(true);

  const fetchAllData = useCallback(async () => {
    if (user) {
      setLoadingSent(true);
      setLoadingReceived(true);

      const [userSentInvites, userReceivedInvites] = await Promise.all([
        getSentInvitesForUser(user.id),
        getReceivedInvitesForUser(user.id),
      ]);
      
      setSentInvites(userSentInvites);
      setReceivedInvites(userReceivedInvites.filter(invite => !!invite.circleId && invite.status === 'pending'));

      setLoadingSent(false);
      setLoadingReceived(false);
    }
  }, [user]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user) {
        fetchAllData();
    }
  }, [user, fetchAllData]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Manage Requests
        </h1>
        <p className="text-muted-foreground">
          View and manage your pending invitations and requests.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Received Circle Invites</CardTitle>
          <CardDescription>
            Invitations from others waiting for your response.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <ReceivedInvitesTable invites={receivedInvites} loading={loadingReceived} onAction={fetchAllData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sent Circle Invites</CardTitle>
          <CardDescription>
            These are the people you've invited who haven't accepted yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <SentInvitesTable invites={sentInvites} loading={loadingSent} />
        </CardContent>
      </Card>
    </div>
  );
}
