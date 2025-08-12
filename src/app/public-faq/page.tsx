import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PublicFaqPage() {
  const faqItems = [
    {
      question: "What is MirrorNet™?",
      answer:
        "MirrorNet™ is a personal development tool designed to help you understand yourself better through the eyes of people you trust. It provides a structured way to receive anonymous, constructive feedback on key personal and professional traits from different groups in your life, such as family, friends, and colleagues.",
    },
    {
      question: "How does it work?",
      answer: (
        <div className="space-y-2">
          <p>The process is simple:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>You join or create private 'circles' for different areas of your life (e.g., 'Work', 'Family').</li>
            <li>You and other members of a circle rate each other on a predefined set of relevant traits.</li>
            <li>The app then aggregates this feedback, showing you your personal average scores for each trait. This allows you to see trends and gain insights into how you're perceived by that circle.</li>
          </ul>
        </div>
      )
    },
    {
      question: "Is my feedback anonymous?",
      answer:
        "Yes, absolutely. For standard circle ratings, your individual scores are never revealed. All feedback is combined and presented as an aggregated average for each trait. For Attraction Ratings, your feedback is anonymous by default. Premium users have the option to attach their identity to an attraction rating they give.",
    },
    {
      question: "Who can see my scores?",
      answer:
        "Only you can see your detailed dashboard and the personal average scores you receive from your private circles (Family, Friends, Work, etc.). Other members of a circle cannot see your personal scores. For the premium Attraction feature, your average scores are also only visible to you. The individual ratings that make up that score remain private and anonymous unless a user accepts a reveal request.",
    },
    {
      question: "What is the Eco Rating?",
      answer:
        "The Eco Rating is a self-assessment feature that helps you reflect on your environmental habits. By answering a series of questions about your lifestyle in areas like energy use, waste management, and transportation, you receive a set of scores from 1 to 10. This provides a private, personal benchmark to understand your environmental impact and identify areas where you can make more sustainable choices. Your Eco Rating is only visible to you.",
    },
    {
      question: "What are the Premium features?",
      answer: (
         <div className="space-y-2">
            <p>Our Premium membership unlocks deeper insights and new ways to connect:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong>View Attraction Ratings:</strong> See your average scores on traits like Charm, Witty, and Authenticity from anyone on the platform.</li>
                <li><strong>Use Premium Tokens:</strong> Get tokens monthly to request an identity reveal from an anonymous rater, or to rate someone outside your established circles.</li>
                <li><strong>Suggest Family Goals:</strong> Propose shared 30-day goals to family members to strengthen your connection.</li>
                <li><strong>Premium Badge:</strong> A badge on your profile to show you support the platform.</li>
            </ul>
        </div>
      )
    },
    {
      question: "How is my data protected?",
      answer:
        "We take user privacy and data protection very seriously. Your data is securely stored using Firebase's robust infrastructure. We only collect the necessary information to make the app function, and we do not share your personal data or individual ratings with third parties. All feedback is anonymized and aggregated by default to protect your identity.",
    },
    {
      question: "Can I use MirrorNet™ for professional development?",
      answer:
        "Yes! The 'Work' circle is specifically designed for professional feedback. You can invite colleagues to get insights into traits like professionalism, reliability, and collaboration. It's a great way to get a well-rounded view of your professional strengths and areas for growth outside of formal performance reviews.",
    },
    {
      question: "How can I contact support?",
      answer:
        "For any questions, support issues, or feedback, please email us at mirror@mirrornet.net. We're happy to help!",
    },
  ];

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold font-headline">
          Frequently Asked Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-lg font-semibold text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
