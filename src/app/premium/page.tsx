"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gem, Target, Eye, HelpCircle, UserPlus, Check, ExternalLink, LoaderCircle } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { payments } from '@/lib/firebase';
import { getProducts, Product, createCheckoutSession } from '@stripe/firestore-stripe-payments';

export default function PremiumPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const fetchedProducts = await getProducts(payments, {
          includePrices: true,
          activeOnly: true,
        });
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load subscription plans.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [toast]);

  const premiumFeatures = [
    {
      icon: <Target className="w-5 h-5 text-primary" />,
      title: "Suggest Family Goals",
      description: "Propose shared 30-day goals to family members to foster connection and mutual growth.",
    },
    {
      icon: <Eye className="w-5 h-5 text-primary" />,
      title: "View Your Attraction Scores",
      description: "See how others anonymously rate you on traits like charm, wit, and authenticity.",
    },
    {
      icon: <HelpCircle className="w-5 h-5 text-primary" />,
      title: "Use Premium Tokens",
      description: "Get tokens monthly to request an identity reveal from an anonymous rater.",
    },
     {
      icon: <UserPlus className="w-5 h-5 text-primary" />,
      title: "Rate Users for Attractiveness",
      description: "Rate anyone on the platform for attraction, even if they are not in your circles.",
    },
    {
      icon: <Gem className="w-5 h-5 text-primary" />,
      title: "Premium Profile Badge",
      description: "Get a premium badge next to your profile to show your support for the platform.",
    },
  ];

    const handleSubscribe = async (product: Product) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not signed in",
        description: "You must be signed in to subscribe.",
      });
      return;
    }
    
    setIsSubscribing(true);
    try {
      if (!product.prices || product.prices.length === 0) {
        throw new Error("No price found for this product.");
      }
      const priceId = product.prices[0].id;

      const session = await createCheckoutSession(payments, {
        price: priceId,
        success_url: window.location.origin + "/dashboard",
        cancel_url: window.location.href,
      });
      window.location.assign(session.url);

    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      toast({
        variant: "destructive",
        title: "Subscription Error",
        description: error.message || "Could not initiate the subscription process. Please try again.",
      });
       setIsSubscribing(false);
    }
  };
  
  const product = products[0];
  const price = product?.prices?.[0];

  
  return (
    <div className="flex justify-center items-center py-12">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full w-fit mb-4">
              <Gem className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline">Go Premium</CardTitle>
          {user?.isPremium ? (
             <CardDescription>
                You are already a premium member. Thank you for your support!
            </CardDescription>
          ) : (
            <CardDescription>
                Unlock exclusive features and gain deeper insights into how you're perceived.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 text-primary bg-primary/10 p-1.5 rounded-full">
                    <Check className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

        </CardContent>
        <CardFooter className="flex flex-col">
          {user?.isPremium ? (
            <Button asChild className="w-full text-lg py-6" variant="outline">
              <Link href="/dashboard">
                  Back to Dashboard
              </Link>
            </Button>
          ) : loading ? (
             <div className="w-full text-center p-4">
                <Skeleton className="h-12 w-full" />
             </div>
          ) : product && price ? (
             <div className="w-full text-center space-y-4">
                <Button onClick={() => handleSubscribe(product)} disabled={isSubscribing} className="w-full text-lg py-6">
                    {isSubscribing && <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />}
                    Subscribe for {new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency }).format(price.unit_amount! / 100)} / {price.interval}
                </Button>
                 <p className="text-xs text-muted-foreground">You will be redirected to Stripe to complete your purchase.</p>
             </div>
          ) : (
             <div className="w-full text-center p-4 bg-secondary rounded-lg">
                <p className="font-semibold text-card-foreground">No Plans Available</p>
                <p className="text-sm text-muted-foreground">Premium subscription plans are not available at this time. Please check back later.</p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
