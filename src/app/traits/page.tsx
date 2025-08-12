import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { defaultCircles, traitDefinitions, attractionTraits } from "@/lib/data";
import { Users, Heart, Briefcase, Globe, Sparkles } from "lucide-react";

const circleIcons: Record<string, React.ReactNode> = {
  Friends: <Users className="w-5 h-5 text-primary" />,
  Family: <Heart className="w-5 h-5 text-primary" />,
  Work: <Briefcase className="w-5 h-5 text-primary" />,
  General: <Globe className="w-5 h-5 text-primary" />,
  Attraction: <Sparkles className="w-5 h-5 text-primary" />,
};

export default function TraitsGuidePage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Traits Guide
        </h1>
        <p className="text-muted-foreground">
          Understand the meaning of each trait to provide fair and accurate ratings.
        </p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Trait Definitions by Category</CardTitle>
            <CardDescription>Click on a category to see the traits associated with it and what they mean.</CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full" defaultValue="Family">
            {defaultCircles.map((circle) => (
                <AccordionItem key={circle.name} value={circle.name}>
                    <AccordionTrigger className="text-xl font-semibold">
                        <div className="flex items-center gap-3">
                           {circleIcons[circle.name]} 
                           {circle.name}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <ul className="space-y-4 pt-2 pl-4">
                           {circle.traits.map(trait => (
                                <li key={trait.name} className="flex flex-col">
                                    <span className="font-semibold text-base">{trait.name}</span>
                                    <p className="text-muted-foreground">
                                       {(traitDefinitions as Record<string, string>)[trait.name] || "No definition available."}
                                    </p>
                                </li>
                           ))}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            ))}

            <AccordionItem value="Attraction">
                <AccordionTrigger className="text-xl font-semibold">
                    <div className="flex items-center gap-3">
                        {circleIcons["Attraction"]}
                        Attraction (Premium)
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <ul className="space-y-4 pt-2 pl-4">
                        {attractionTraits.map(trait => (
                            <li key={trait.name} className="flex flex-col">
                                <span className="font-semibold text-base">{trait.name}</span>
                                <p className="text-muted-foreground">
                                    {trait.definition}
                                </p>
                            </li>
                        ))}
                    </ul>
                </AccordionContent>
            </AccordionItem>

            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
