export interface QuestionOption {
    text: string;
    value: number;
}

export interface Question {
    id: string;
    text: string;
    options: QuestionOption[];
}

export const familyQuestions: Record<string, Question[]> = {
    "Caring": [
        {
            id: "caring-1",
            text: "When a family member is upset, what is your first instinct?",
            options: [
                { text: "To give them space until they figure it out.", value: 1 },
                { text: "To offer advice on how to solve their problem.", value: 2 },
                { text: "To listen without judgment and offer comfort.", value: 3 },
            ],
        },
        {
            id: "caring-2",
            text: "How often do you proactively check in on your family members, just to see how they're doing?",
            options: [
                { text: "Rarely, we usually only talk when something specific is needed.", value: 1 },
                { text: "Sometimes, when I think of it or on special occasions.", value: 2 },
                { text: "Regularly, it's a normal part of our relationship.", value: 3 },
            ],
        },
        {
            id: "caring-3",
            text: "How do you acknowledge important dates like birthdays or anniversaries?",
            options: [
                { text: "I sometimes forget or send a last-minute message.", value: 1 },
                { text: "I usually send a text or make a quick call.", value: 2 },
                { text: "I make a point to celebrate them in a thoughtful or personal way.", value: 3 },
            ],
        },
    ],
    "Respectful": [
        {
            id: "respectful-1",
            text: "During a disagreement, how do you typically behave?",
            options: [
                { text: "I focus on proving my point and winning the argument.", value: 1 },
                { text: "I try to find a compromise, but can get frustrated if they don't see my side.", value: 2 },
                { text: "I listen to their perspective and try to understand their feelings, even if I disagree.", value: 3 },
            ],
        },
        {
            id: "respectful-2",
            text: "Do you respect your family members' personal boundaries (e.g., privacy, personal space, decision-making)?",
            options: [
                { text: "I'm not always sure what their boundaries are.", value: 1 },
                { text: "I try to, but sometimes I overstep without meaning to.", value: 2 },
                { text: "I make a conscious effort to ask about and honor their boundaries.", value: 3 },
            ],
        },
        {
            id: "respectful-3",
            text: "When a family member shares something in confidence, how do you handle it?",
            options: [
                { text: "I might mention it to another close family member if I think it's helpful.", value: 1 },
                { text: "I keep it to myself but find the responsibility stressful.", value: 2 },
                { text: "I keep it strictly confidential and offer support without sharing their secret.", value: 3 },
            ],
        },
    ],
    "Dependable": [
        {
            id: "dependable-1",
            text: "When you make a promise or commitment to a family member, how often do you follow through?",
            options: [
                { text: "I sometimes forget or other things take priority.", value: 1 },
                { text: "Most of the time, unless something major comes up.", value: 2 },
                { text: "Almost always. My word is my bond.", value: 3 },
            ],
        },
        {
            id: "dependable-2",
            text: "If a family member needed help unexpectedly, how would you react?",
            options: [
                { text: "I'd be hesitant if it disrupts my plans.", value: 1 },
                { text: "I would help if it were convenient for me.", value: 2 },
                { text: "I would do my best to rearrange things and be there for them.", value: 3 },
            ],
        },
        {
            id: "dependable-3",
            text: "How do you handle shared responsibilities or chores in the family?",
            options: [
                { text: "I often need reminders or end up doing them late.", value: 1 },
                { text: "I do my part, but I don't usually go above and beyond.", value: 2 },
                { text: "I complete my responsibilities reliably and will pitch in to help others.", value: 3 },
            ],
        },
    ],
    "Loving": [
        {
            id: "loving-1",
            text: "How do you express affection to your family?",
            options: [
                { text: "I assume they know I love them; I don't express it often.", value: 1 },
                { text: "Through actions and gifts more than words.", value: 2 },
                { text: "Through a combination of words, actions, and physical affection (hugs, etc.).", value: 3 },
            ],
        },
        {
            id: "loving-2",
            text: "How often do you say 'I love you' to your close family members?",
            options: [
                { text: "Rarely or only on very special occasions.", value: 1 },
                { text: "Sometimes, when the moment feels right.", value: 2 },
                { text: "Frequently and freely.", value: 3 },
            ],
        },
        {
            id: "loving-3",
            text: "How do you react to a family member's successes and achievements?",
            options: [
                { text: "I don't always notice or acknowledge them.", value: 1 },
                { text: "I offer a quick congratulations.", value: 2 },
                { text: "I celebrate with them and show genuine excitement for their accomplishments.", value: 3 },
            ],
        },
    ],
    "Protective": [
        {
            id: "protective-1",
            text: "If you saw a family member being treated unfairly by someone else, what would you do?",
            options: [
                { text: "I would avoid getting involved to prevent conflict.", value: 1 },
                { text: "I would offer support to my family member in private later.", value: 2 },
                { text: "I would stand up for them and address the situation directly.", value: 3 },
            ],
        },
        {
            id: "protective-2",
            text: "How do you balance protecting your family with allowing them to be independent?",
            options: [
                { text: "I tend to be overprotective and make decisions for them.", value: 1 },
                { text: "I struggle to find the right balance.", value: 2 },
                { text: "I offer support and guidance but trust them to make their own choices.", value: 3 },
            ],
        },
        {
            id: "protective-3",
            text: "When a family member is making a poor decision, how do you intervene?",
            options: [
                { text: "I stay quiet because it's their life to live.", value: 1 },
                { text: "I express my strong disapproval and tell them what to do instead.", value: 2 },
                { text: "I share my concerns calmly and explain my perspective without being demanding.", value: 3 },
            ],
        },
    ],
};
