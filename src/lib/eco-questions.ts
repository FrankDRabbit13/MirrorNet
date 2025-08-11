export interface QuestionOption {
    text: string;
    value: number;
}

export interface Question {
    id: string;
    text: string;
    options: QuestionOption[];
}

export const ecoQuestions: Record<string, Question[]> = {
    "Energy": [
        {
            id: "energy-1",
            text: "What type of light bulbs do you primarily use in your home?",
            options: [
                { text: "Mostly incandescent or halogen bulbs.", value: 1 },
                { text: "A mix of incandescent and energy-efficient bulbs.", value: 2 },
                { text: "Mostly energy-efficient (LED or CFL) bulbs.", value: 3 },
            ],
        },
        {
            id: "energy-2",
            text: "How often do you unplug electronics or use power strips to turn them off completely when not in use?",
            options: [
                { text: "Rarely or never.", value: 1 },
                { text: "Sometimes, for certain devices.", value: 2 },
                { text: "Almost always, it's a regular habit.", value: 3 },
            ],
        },
        {
            id: "energy-3",
            text: "How do you manage your thermostat for heating and cooling?",
            options: [
                { text: "I keep it at a constant temperature year-round.", value: 1 },
                { text: "I adjust it manually when I feel too hot or cold.", value: 2 },
                { text: "I use a programmable thermostat or adjust it for seasons and when I'm away.", value: 3 },
            ],
        },
    ],
    "Waste": [
         {
            id: "waste-1",
            text: "How consistently do you separate recyclable materials (paper, glass, plastic) from general waste?",
            options: [
                { text: "I don't have a separate system for recycling.", value: 1 },
                { text: "I recycle some items, but not everything.", value: 2 },
                { text: "I diligently recycle all eligible items.", value: 3 },
            ],
        },
        {
            id: "waste-2",
            text: "How do you handle single-use plastics (e.g., shopping bags, water bottles, coffee cups)?",
            options: [
                { text: "I frequently use them for convenience.", value: 1 },
                { text: "I try to avoid them sometimes but still use them.", value: 2 },
                { text: "I consistently use reusable alternatives (reusable bags, bottles, etc.).", value: 3 },
            ],
        },
        {
            id: "waste-3",
            text: "Do you compost organic waste like food scraps?",
            options: [
                { text: "No, it all goes in the general trash.", value: 1 },
                { text: "I'm interested or do it occasionally.", value: 2 },
                { text: "Yes, I have a regular composting system.", value: 3 },
            ],
        },
    ],
    "Transport": [
        {
            id: "transport-1",
            text: "What is your primary mode of transportation for daily commuting (to work, school, etc.)?",
            options: [
                { text: "Driving alone in a personal car.", value: 1 },
                { text: "Carpooling, ride-sharing, or using public transport.", value: 2 },
                { text: "Walking, biking, or working from home.", value: 3 },
            ],
        },
        {
            id: "transport-2",
            text: "How often do you choose to walk, bike, or use public transport for short trips (under 2 miles / 3 km)?",
            options: [
                { text: "Almost never, I usually drive.", value: 1 },
                { text: "Sometimes, when it's convenient.", value: 2 },
                { text: "Frequently or whenever possible.", value: 3 },
            ],
        },
    ],
    "Consumption": [
        {
            id: "consumption-1",
            text: "When shopping, how often do you consider the environmental impact of products (e.g., local, organic, minimal packaging)?",
            options: [
                { text: "This is not a major factor in my purchasing decisions.", value: 1 },
                { text: "I think about it for certain products, like food or clothing.", value: 2 },
                { text: "It's a key consideration for most of my purchases.", value: 3 },
            ],
        },
        {
            id: "consumption-2",
            text: "How do you approach replacing items (e.g., electronics, clothing)?",
            options: [
                { text: "I prefer to buy new items as soon as they show wear or a new model comes out.", value: 1 },
                { text: "I use things until they break, then replace them.", value: 2 },
                { text: "I try to repair items first or buy second-hand whenever possible.", value: 3 },
            ],
        },
    ],
    "Water": [
        {
            id: "water-1",
            text: "How mindful are you of the length of your showers?",
            options: [
                { text: "I enjoy long, relaxing showers without much thought to time.", value: 1 },
                { text: "I'm aware of the time but don't strictly limit it.", value: 2 },
                { text: "I actively take short showers (e.g., under 5-7 minutes).", value: 3 },
            ],
        },
        {
            id: "water-2",
            text: "Do you turn off the tap while brushing your teeth, soaping hands, or washing dishes?",
            options: [
                { text: "No, I usually leave it running.", value: 1 },
                { text: "I do it sometimes but can forget.", value: 2 },
                { text: "Yes, this is a consistent habit for me.", value: 3 },
            ],
        },
    ],
};
