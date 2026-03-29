import type { AgentDefinition } from "@/types/agent";

export const AGENTS: AgentDefinition[] = [
  {
    id: "hotel",
    name: "Hotel Concierge",
    tagline: "Your 24/7 front desk assistant",
    description:
      "Handles bookings, room service, guest inquiries, complaints, and concierge services in 90+ languages.",
    icon: "Hotel",
    accentColor: "#F59E0B",
    capabilities: [
      "Booking Management",
      "Room Service",
      "Guest FAQ",
      "Complaint Resolution",
    ],
    configFields: [
      { id: "hotelName", label: "Hotel Name", type: "text", defaultValue: "Grand Hotel" },
      {
        id: "hotelType",
        label: "Hotel Type",
        type: "select",
        options: ["Luxury", "Business", "Budget", "Resort", "Boutique"],
        defaultValue: "Luxury",
      },
    ],
  },
  {
    id: "medical",
    name: "Medical Assistant",
    tagline: "Compassionate patient support",
    description:
      "Helps with appointment scheduling, symptom pre-screening, medication reminders, and patient FAQ.",
    icon: "Stethoscope",
    accentColor: "#10B981",
    capabilities: [
      "Appointment Booking",
      "Symptom Pre-Screen",
      "Medication Info",
      "Insurance FAQ",
    ],
    configFields: [
      { id: "clinicName", label: "Clinic/Hospital Name", type: "text", defaultValue: "City Clinic" },
      {
        id: "specialty",
        label: "Specialty",
        type: "select",
        options: [
          "General",
          "Dental",
          "Cardiology",
          "Pediatrics",
          "Dermatology",
        ],
        defaultValue: "General",
      },
    ],
  },
  {
    id: "interview",
    name: "Interview Coach",
    tagline: "Ace your next tech interview",
    description:
      "Conducts mock interviews based on your tech stack. Asks questions, evaluates answers, gives real-time feedback on communication.",
    icon: "Code",
    accentColor: "#6366F1",
    capabilities: [
      "Mock Interviews",
      "Code Review",
      "System Design",
      "Behavioral Prep",
    ],
    configFields: [
      {
        id: "techStack",
        label: "Tech Stack",
        type: "multi-select",
        options: [
          "React",
          "Next.js",
          "Node.js",
          "TypeScript",
          "Python",
          "Java",
          "Go",
          "Rust",
          "AWS",
          "Docker",
          "Kubernetes",
          "System Design",
          "DSA",
        ],
        defaultValue: ["React", "TypeScript", "Node.js"],
      },
      {
        id: "level",
        label: "Experience Level",
        type: "select",
        options: ["Junior", "Mid", "Senior", "Staff", "Principal"],
        defaultValue: "Mid",
      },
      { id: "company", label: "Target Company (optional)", type: "text", defaultValue: "" },
    ],
  },
  {
    id: "restaurant",
    name: "Restaurant Host",
    tagline: "Smart ordering & reservations",
    description:
      "Takes voice orders, handles customizations, manages reservations, and answers menu questions.",
    icon: "UtensilsCrossed",
    accentColor: "#EF4444",
    capabilities: [
      "Voice Ordering",
      "Menu Recommendations",
      "Reservation Management",
      "Allergy Info",
    ],
    configFields: [
      { id: "restaurantName", label: "Restaurant Name", type: "text", defaultValue: "The Kitchen" },
      {
        id: "cuisineType",
        label: "Cuisine",
        type: "select",
        options: [
          "Italian",
          "Indian",
          "Japanese",
          "Mexican",
          "American",
          "Chinese",
          "Mediterranean",
        ],
        defaultValue: "Indian",
      },
    ],
  },
  {
    id: "legal",
    name: "Legal Advisor",
    tagline: "Preliminary legal guidance",
    description:
      "Provides general legal information, explains legal terms, helps draft basic documents, and guides on procedures.",
    icon: "Scale",
    accentColor: "#8B5CF6",
    capabilities: [
      "Legal FAQ",
      "Document Drafting",
      "Term Explanations",
      "Procedure Guidance",
    ],
    configFields: [
      { id: "jurisdiction", label: "Jurisdiction", type: "text", defaultValue: "India" },
      {
        id: "legalArea",
        label: "Legal Area",
        type: "select",
        options: [
          "Corporate",
          "Employment",
          "Real Estate",
          "Intellectual Property",
          "Family",
          "Criminal",
        ],
        defaultValue: "Corporate",
      },
    ],
  },
];

export function getAgentById(id: string): AgentDefinition | undefined {
  return AGENTS.find((a) => a.id === id);
}
