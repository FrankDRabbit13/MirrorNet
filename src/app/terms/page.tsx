import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold font-headline">
          Terms of Service
        </CardTitle>
        <CardDescription>Last Updated: July 29, 2024</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-sm text-muted-foreground">
        <div className="space-y-2">
            <h2 className="text-lg font-semibold text-card-foreground">1. Introduction</h2>
            <p>
                Welcome to MirrorNet™ ("we," "our," "us"). These Terms of Service govern your use of our web application. By accessing or using MirrorNet™, you agree to be bound by these terms.
            </p>
        </div>
        <div className="space-y-2">
            <h2 className="text-lg font-semibold text-card-foreground">2. User Accounts</h2>
            <p>
                To use most features of MirrorNet™, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information when creating an account.
            </p>
        </div>
        <div className="space-y-2">
            <h2 className="text-lg font-semibold text-card-foreground">3. User Conduct</h2>
            <p>
                You agree not to use MirrorNet™ to:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Post any content that is unlawful, harmful, threatening, abusive, or otherwise objectionable.</li>
                <li>Impersonate any person or entity.</li>
                <li>Violate any applicable local, state, national, or international law.</li>
                <li>Harass, threaten, or defame any other user.</li>
            </ul>
        </div>
        <div className="space-y-2">
            <h2 className="text-lg font-semibold text-card-foreground">4. Content and Ratings</h2>
            <p>
                You are solely responsible for the ratings and feedback you provide. While most ratings are anonymous, you acknowledge that you are providing this feedback honestly and constructively. We are not responsible for the content of user-submitted ratings but reserve the right to remove content that violates our policies.
            </p>
        </div>
         <div className="space-y-2">
            <h2 className="text-lg font-semibold text-card-foreground">5. Premium Services</h2>
            <p>
                We offer premium features for a subscription fee. All payments are non-refundable. We reserve the right to change our prices and will notify you in advance of any such changes. Premium features, such as Reveal Tokens, are subject to the rules and limitations described within the application.
            </p>
        </div>
        <div className="space-y-2">
            <h2 className="text-lg font-semibold text-card-foreground">6. Termination</h2>
            <p>
                We may terminate or suspend your account at our sole discretion, without prior notice, for conduct that violates these Terms of Service or is otherwise harmful to other users or our platform.
            </p>
        </div>
        <div className="space-y-2">
            <h2 className="text-lg font-semibold text-card-foreground">7. Disclaimers</h2>
            <p>
                MirrorNet™ is provided "as is" and "as available" without any warranties of any kind. We do not guarantee the accuracy, completeness, or usefulness of any information on the service and you are responsible for your own self-assessment based on the feedback received.
            </p>
        </div>
        <div className="space-y-2">
            <h2 className="text-lg font-semibold text-card-foreground">8. Changes to Terms</h2>
            <p>
                We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new Terms of Service on this page. Your continued use of the service after any such changes constitutes your acceptance of the new terms.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
