"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoaderCircle, Gem, ShieldCheck, KeyRound, Upload, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { auth, payments } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { createPortalLink } from "@stripe/firestore-stripe-payments";
import { checkAndResetTokens, type User } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { uploadFile } from "@/app/actions/upload";
import Link from "next/link";

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, updateUser } = useUser();
  const [displayName, setDisplayName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhotoUrl(user.photoUrl || "");
      checkAndResetTokens(user); 
    }
  }, [user]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select an image smaller than 2MB.",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);
      
      const result = await uploadFile(formData);

      if (result.error) {
        throw new Error(result.error);
      }

      setPhotoUrl(result.url!);
      toast({
        title: "Photo Ready!",
        description: "Your new profile picture is ready. Save changes to confirm.",
      });
    } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "Could not upload photo. Please ensure CORS is configured correctly for your storage bucket.",
        });
        console.error("--- UPLOAD FAILED ---");
        console.error("Error:", error);
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
    }
  };


  const handleSaveChanges = async () => {
    if (!user) return;
    
    const changes: Partial<User> = {};
    if (displayName !== user.displayName) {
      changes.displayName = displayName;
      changes.displayName_lowercase = displayName.toLowerCase();
    }
    if (photoUrl !== user.photoUrl) {
      changes.photoUrl = photoUrl;
    }

    if (Object.keys(changes).length === 0) return;

    setIsSaving(true);
    try {
      await updateUser(changes);
      toast({
        title: "Profile updated",
        description: "Your changes have been successfully saved.",
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile.",
      });
    } finally {
        setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
        toast({ variant: "destructive", title: "Error", description: "No email address found for your account." });
        return;
    }
    setIsResettingPassword(true);
    try {
        await sendPasswordResetEmail(auth, user.email);
        toast({
            title: "Password Reset Email Sent",
            description: "Please check your inbox for instructions to change your password.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to send password reset email. Please try again later.",
        });
    } finally {
        setIsResettingPassword(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsManagingSubscription(true);
    try {
      const portalLink = await createPortalLink(payments, {
        returnUrl: window.location.href
      });
      window.location.assign(portalLink);
    } catch (error: any) {
      console.error("Error creating portal link:", error);
      toast({
        variant: "destructive",
        title: "Portal Error",
        description: error.message || "Could not open the customer portal. Please try again later.",
      });
       setIsManagingSubscription(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-full">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const hasChanges = user ? (displayName !== user.displayName) || (photoUrl !== user.photoUrl) : false;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          My Profile
        </h1>
        <p className="text-muted-foreground">
          Update your profile information and manage your account status.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
             <CardTitle>Profile Details</CardTitle>
             {user.isAdmin && (
                <Badge variant="secondary">
                    <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                    Administrator
                </Badge>
             )}
          </div>
          <CardDescription>
            This information will be visible to members of your circles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={photoUrl} alt={displayName} />
                <AvatarFallback>{(displayName || ' ').charAt(0)}</AvatarFallback>
              </Avatar>
              {isUploading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-full">
                  <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-1 w-full sm:w-auto">
               <Input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 onChange={handlePhotoUpload}
                 accept="image/png, image/jpeg, image/gif"
                 disabled={isUploading}
               />
               <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? "Uploading..." : "Upload Photo"}
               </Button>
               <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 2MB.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input 
              id="displayName" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={user.email || ''} disabled />
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
            <Button onClick={handleSaveChanges} disabled={!hasChanges || isSaving}>
              {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={handlePasswordReset} disabled={isResettingPassword}>
                 {isResettingPassword ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <KeyRound className="mr-2 h-4 w-4" />
                )}
                {isResettingPassword ? "Sending..." : "Change Password"}
            </Button>
        </CardFooter>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>
            Manage your premium membership.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.isPremium ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-secondary/50 rounded-lg gap-4">
                <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-2">
                        <Gem className="w-5 h-5 text-primary" />
                        <p className="font-semibold">You are a Premium member!</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Reveal Tokens:</span>
                        <span className="font-bold text-lg text-primary">{user.revealTokens || 0}</span>
                    </div>
                </div>
                 <Button onClick={handleManageSubscription} disabled={isManagingSubscription}>
                  {isManagingSubscription && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                   Manage Subscription
                   <ExternalLink className="ml-2 h-4 w-4" />
                 </Button>
            </div>
          ) : (
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-secondary/50 rounded-lg gap-4">
                 <p className="font-semibold text-muted-foreground">You are currently on the Standard plan.</p>
                <Button asChild>
                  <Link href="/premium">
                    <Gem className="mr-2 h-4 w-4" />
                     View Premium
                  </Link>
                </Button>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
