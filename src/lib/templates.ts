import type { AgentConfigField } from "@/types/agent";

export interface AgentTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  accentColor: string;
  capabilities: string[];
  configFields: AgentConfigField[];
  defaultGreeting: string;
  defaultPersonality: string;
  defaultKnowledgeCategories: string[];
  defaultBusinessDataTypes: string[];
}

export const TEMPLATES: AgentTemplate[] = [
  {
    id: "hotel",
    name: "Hotel Concierge",
    tagline: "Your 24/7 front desk assistant",
    description:
      "Handles bookings, room service, guest inquiries, complaints, and concierge services.",
    icon: "Hotel",
    accentColor: "#F59E0B",
    capabilities: ["Booking Management", "Room Service", "Guest FAQ", "Complaint Resolution"],
    configFields: [
      { id: "hotelName", label: "Hotel Name", type: "text", defaultValue: "Grand Hotel" },
      { id: "hotelType", label: "Hotel Type", type: "select", options: ["Luxury", "Business", "Budget", "Resort", "Boutique"], defaultValue: "Luxury" },
    ],
    defaultGreeting: "Welcome! How can I help you today?",
    defaultPersonality: "Warm, professional, and attentive. Speak like a 5-star concierge.",
    defaultKnowledgeCategories: ["faq", "policy", "amenities", "local_attractions"],
    defaultBusinessDataTypes: ["rooms", "services", "amenities", "policies"],
  },
  {
    id: "medical",
    name: "Medical Assistant",
    tagline: "Compassionate patient support",
    description:
      "Helps with appointment scheduling, symptom pre-screening, medication reminders, and patient FAQ.",
    icon: "Stethoscope",
    accentColor: "#10B981",
    capabilities: ["Appointment Booking", "Symptom Pre-Screen", "Medication Info", "Insurance FAQ"],
    configFields: [
      { id: "clinicName", label: "Clinic/Hospital Name", type: "text", defaultValue: "City Clinic" },
      { id: "specialty", label: "Specialty", type: "select", options: ["General", "Dental", "Cardiology", "Pediatrics", "Dermatology"], defaultValue: "General" },
    ],
    defaultGreeting: "Hello! Welcome to our clinic. How can I assist you?",
    defaultPersonality: "Compassionate, clear, and reassuring. Always clarify you are an AI, not a doctor.",
    defaultKnowledgeCategories: ["faq", "services", "insurance", "procedures"],
    defaultBusinessDataTypes: ["doctors", "services", "hours", "insurance_accepted"],
  },
  {
    id: "interview",
    name: "Interview Coach",
    tagline: "Ace your next tech interview",
    description:
      "Conducts mock interviews based on your tech stack. Gives real-time feedback.",
    icon: "Code",
    accentColor: "#6366F1",
    capabilities: ["Mock Interviews", "Code Review", "System Design", "Behavioral Prep"],
    configFields: [
      { id: "techStack", label: "Tech Stack", type: "multi-select", options: ["React", "Next.js", "Node.js", "TypeScript", "Python", "Java", "Go", "Rust", "AWS", "Docker", "Kubernetes", "System Design", "DSA"], defaultValue: ["React", "TypeScript", "Node.js"] },
      { id: "level", label: "Experience Level", type: "select", options: ["Junior", "Mid", "Senior", "Staff", "Principal"], defaultValue: "Mid" },
      { id: "company", label: "Target Company (optional)", type: "text", defaultValue: "" },
    ],
    defaultGreeting: "Hi! Ready for your mock interview? Let's get started.",
    defaultPersonality: "Encouraging but honest. Professional interviewer tone.",
    defaultKnowledgeCategories: ["questions", "rubrics", "tips"],
    defaultBusinessDataTypes: ["question_bank", "evaluation_criteria"],
  },
  {
    id: "restaurant",
    name: "Restaurant Host",
    tagline: "Smart ordering & reservations",
    description:
      "Takes voice orders, handles customizations, manages reservations, and answers menu questions.",
    icon: "UtensilsCrossed",
    accentColor: "#EF4444",
    capabilities: ["Voice Ordering", "Menu Recommendations", "Reservation Management", "Allergy Info"],
    configFields: [
      { id: "restaurantName", label: "Restaurant Name", type: "text", defaultValue: "The Kitchen" },
      { id: "cuisineType", label: "Cuisine", type: "select", options: ["Italian", "Indian", "Japanese", "Mexican", "American", "Chinese", "Mediterranean"], defaultValue: "Indian" },
    ],
    defaultGreeting: "Welcome! Would you like to place an order or make a reservation?",
    defaultPersonality: "Friendly, enthusiastic about food. Repeat orders back for confirmation.",
    defaultKnowledgeCategories: ["faq", "allergens", "specials"],
    defaultBusinessDataTypes: ["menu_items", "hours", "specials", "reservation_policy"],
  },
  {
    id: "legal",
    name: "Legal Advisor",
    tagline: "Preliminary legal guidance",
    description:
      "Provides general legal information, explains legal terms, helps draft basic documents.",
    icon: "Scale",
    accentColor: "#8B5CF6",
    capabilities: ["Legal FAQ", "Document Drafting", "Term Explanations", "Procedure Guidance"],
    configFields: [
      { id: "jurisdiction", label: "Jurisdiction", type: "text", defaultValue: "India" },
      { id: "legalArea", label: "Legal Area", type: "select", options: ["Corporate", "Employment", "Real Estate", "Intellectual Property", "Family", "Criminal"], defaultValue: "Corporate" },
    ],
    defaultGreeting: "Hello! I can help with general legal information. How can I assist?",
    defaultPersonality: "Professional, precise, cautious. Always disclaim: general info only, not legal advice.",
    defaultKnowledgeCategories: ["faq", "procedures", "templates", "regulations"],
    defaultBusinessDataTypes: ["practice_areas", "attorneys", "fee_structure"],
  },
];

export function getTemplateById(id: string): AgentTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
