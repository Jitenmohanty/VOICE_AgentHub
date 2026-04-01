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
      // Basic Info
      { id: "hotelName", label: "Hotel Name", type: "text", defaultValue: "Grand Hotel", section: "Basic Info" },
      { id: "hotelType", label: "Hotel Type", type: "select", options: ["Luxury", "Business", "Budget", "Resort", "Boutique", "Motel", "Hostel"], defaultValue: "Luxury", section: "Basic Info" },
      { id: "starRating", label: "Star Rating", type: "select", options: ["1 Star", "2 Star", "3 Star", "4 Star", "5 Star"], defaultValue: "5 Star", section: "Basic Info" },
      { id: "totalRooms", label: "Total Rooms", type: "number", defaultValue: 100, min: 1, max: 5000, section: "Basic Info" },
      // Operations
      { id: "checkInTime", label: "Check-in Time", type: "time", defaultValue: "14:00", section: "Operations" },
      { id: "checkOutTime", label: "Check-out Time", type: "time", defaultValue: "11:00", section: "Operations" },
      { id: "roomTypes", label: "Room Types Available", type: "multi-select", options: ["Standard", "Deluxe", "Suite", "Penthouse", "Family Room", "Accessible Room", "Presidential Suite"], defaultValue: ["Standard", "Deluxe", "Suite"], section: "Operations" },
      // Amenities
      { id: "amenities", label: "Amenities", type: "multi-select", options: ["Pool", "Gym", "Spa", "Restaurant", "Bar", "Business Center", "Conference Rooms", "Free WiFi", "Parking", "Airport Shuttle", "Concierge", "Laundry", "Kids Club", "Pet Friendly"], defaultValue: ["Free WiFi", "Pool", "Gym", "Restaurant"], section: "Amenities" },
      { id: "parkingInfo", label: "Parking Details", type: "text", defaultValue: "Complimentary valet parking for all guests", placeholder: "e.g., Free valet, self-parking $20/day", section: "Amenities" },
      { id: "roomServiceHours", label: "Room Service Hours", type: "text", defaultValue: "24/7", placeholder: "e.g., 6 AM - 11 PM or 24/7", section: "Amenities" },
      // Policies
      { id: "cancellationPolicy", label: "Cancellation Policy", type: "textarea", defaultValue: "Free cancellation up to 24 hours before check-in. Late cancellations are charged one night's stay.", placeholder: "Describe your cancellation policy...", section: "Policies" },
      { id: "petPolicy", label: "Pet Friendly", type: "toggle", defaultValue: false, section: "Policies" },
      { id: "nearbyAttractions", label: "Nearby Attractions", type: "textarea", defaultValue: "", placeholder: "List nearby landmarks, restaurants, attractions...", section: "Local Info" },
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
      // Basic Info
      { id: "clinicName", label: "Clinic / Hospital Name", type: "text", defaultValue: "City Clinic", section: "Basic Info" },
      { id: "specialty", label: "Primary Specialty", type: "select", options: ["General Practice", "Dental", "Cardiology", "Pediatrics", "Dermatology", "Orthopedics", "Neurology", "Ophthalmology", "Gynecology", "Psychiatry", "ENT", "Urology"], defaultValue: "General Practice", section: "Basic Info" },
      { id: "additionalSpecialties", label: "Additional Specialties", type: "multi-select", options: ["General Practice", "Dental", "Cardiology", "Pediatrics", "Dermatology", "Orthopedics", "Neurology", "Ophthalmology", "Gynecology", "Psychiatry", "ENT", "Urology", "Radiology", "Pathology"], section: "Basic Info" },
      // Operations
      { id: "workingDays", label: "Working Days", type: "multi-select", options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], defaultValue: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], section: "Operations" },
      { id: "openTime", label: "Opening Time", type: "time", defaultValue: "09:00", section: "Operations" },
      { id: "closeTime", label: "Closing Time", type: "time", defaultValue: "18:00", section: "Operations" },
      { id: "appointmentDuration", label: "Default Appointment Duration (minutes)", type: "number", defaultValue: 30, min: 5, max: 120, section: "Operations" },
      { id: "walkInsAccepted", label: "Walk-ins Accepted", type: "toggle", defaultValue: true, section: "Operations" },
      // Insurance & Billing
      { id: "insuranceAccepted", label: "Insurance Plans Accepted", type: "multi-select", options: ["Medicare", "Medicaid", "Blue Cross", "Aetna", "United Healthcare", "Cigna", "Humana", "Kaiser", "Star Health", "ICICI Lombard", "Max Bupa", "Cash Only"], defaultValue: ["Medicare", "Blue Cross"], section: "Insurance" },
      { id: "consultationFee", label: "Base Consultation Fee", type: "text", defaultValue: "", placeholder: "e.g., $150 or ₹500", section: "Insurance" },
      // Emergency
      { id: "emergencyProtocol", label: "Emergency Instructions", type: "textarea", defaultValue: "For emergencies, please call 108 or go to the nearest emergency room immediately.", placeholder: "What should patients do in an emergency?", section: "Emergency" },
      { id: "hasEmergencyServices", label: "Emergency Services Available", type: "toggle", defaultValue: false, section: "Emergency" },
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
      // Core Setup
      { id: "techStack", label: "Tech Stack", type: "multi-select", options: ["React", "Next.js", "Node.js", "TypeScript", "Python", "Java", "Go", "Rust", "C++", "C#", "Ruby", "Swift", "Kotlin", "AWS", "GCP", "Azure", "Docker", "Kubernetes", "System Design", "DSA", "SQL", "MongoDB", "GraphQL", "REST API"], defaultValue: ["React", "TypeScript", "Node.js"], section: "Core Setup" },
      { id: "level", label: "Experience Level", type: "select", options: ["Intern", "Junior", "Mid", "Senior", "Staff", "Principal", "Director"], defaultValue: "Mid", section: "Core Setup" },
      { id: "company", label: "Target Company", type: "text", defaultValue: "", placeholder: "e.g., Google, Amazon, Startup...", section: "Core Setup" },
      { id: "yearsExperience", label: "Years of Experience", type: "number", defaultValue: 3, min: 0, max: 30, section: "Core Setup" },
      // Interview Style
      { id: "interviewStyle", label: "Interview Style", type: "select", options: ["FAANG Style", "Startup Style", "Consulting Style", "Behavioral Focus", "System Design Focus", "Coding Focus", "Mixed"], defaultValue: "Mixed", section: "Interview Style" },
      { id: "questionTypes", label: "Question Types to Cover", type: "multi-select", options: ["Coding / DSA", "System Design", "Behavioral / STAR", "Low-Level Design", "API Design", "Frontend Specific", "Backend Specific", "DevOps / Cloud", "Machine Learning", "Database Design"], defaultValue: ["Coding / DSA", "System Design", "Behavioral / STAR"], section: "Interview Style" },
      { id: "difficultyLevel", label: "Starting Difficulty", type: "select", options: ["Easy", "Medium", "Hard", "Adaptive (auto-adjust)"], defaultValue: "Adaptive (auto-adjust)", section: "Interview Style" },
      // Session Config
      { id: "totalRounds", label: "Number of Questions per Session", type: "number", defaultValue: 5, min: 1, max: 20, section: "Session Config" },
      { id: "includeSystemDesign", label: "Include System Design Round", type: "toggle", defaultValue: true, section: "Session Config" },
      { id: "includeBehavioral", label: "Include Behavioral Round", type: "toggle", defaultValue: true, section: "Session Config" },
      // Feedback Preferences
      { id: "feedbackStyle", label: "Feedback Style", type: "select", options: ["After Each Question", "End of Session Summary", "Both"], defaultValue: "After Each Question", section: "Feedback" },
      { id: "scoringEnabled", label: "Score Each Answer (1-10)", type: "toggle", defaultValue: true, section: "Feedback" },
      { id: "communicationFeedback", label: "Communication Feedback", type: "toggle", defaultValue: true, description: "Get feedback on filler words, clarity, and confidence", section: "Feedback" },
      // Custom Instructions
      { id: "customInstructions", label: "Special Instructions", type: "textarea", defaultValue: "", placeholder: "e.g., Focus on React hooks, skip easy questions, act like a Google interviewer...", section: "Custom" },
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
      // Basic Info
      { id: "restaurantName", label: "Restaurant Name", type: "text", defaultValue: "The Kitchen", section: "Basic Info" },
      { id: "cuisineType", label: "Primary Cuisine", type: "select", options: ["Italian", "Indian", "Japanese", "Mexican", "American", "Chinese", "Mediterranean", "Thai", "French", "Korean", "Middle Eastern", "Fusion"], defaultValue: "Indian", section: "Basic Info" },
      { id: "diningStyle", label: "Dining Style", type: "select", options: ["Fine Dining", "Casual Dining", "Fast Casual", "Cafe", "Buffet", "Cloud Kitchen", "Food Truck", "Bar & Grill"], defaultValue: "Casual Dining", section: "Basic Info" },
      // Hours & Seating
      { id: "openTime", label: "Opening Time", type: "time", defaultValue: "11:00", section: "Hours" },
      { id: "closeTime", label: "Closing Time", type: "time", defaultValue: "23:00", section: "Hours" },
      { id: "kitchenCloseTime", label: "Kitchen Close Time", type: "time", defaultValue: "22:30", section: "Hours" },
      { id: "totalSeats", label: "Total Seating Capacity", type: "number", defaultValue: 50, min: 1, max: 1000, section: "Hours" },
      // Services
      { id: "reservationsEnabled", label: "Accept Reservations", type: "toggle", defaultValue: true, section: "Services" },
      { id: "deliveryEnabled", label: "Delivery Available", type: "toggle", defaultValue: true, section: "Services" },
      { id: "takeawayEnabled", label: "Takeaway Available", type: "toggle", defaultValue: true, section: "Services" },
      { id: "deliveryRadius", label: "Delivery Radius (km)", type: "number", defaultValue: 5, min: 1, max: 50, section: "Services" },
      { id: "minimumOrder", label: "Minimum Order for Delivery", type: "text", defaultValue: "", placeholder: "e.g., $15 or ₹300", section: "Services" },
      // Dietary & Allergens
      { id: "dietaryOptions", label: "Dietary Options Available", type: "multi-select", options: ["Vegetarian", "Vegan", "Gluten-Free", "Halal", "Kosher", "Nut-Free", "Dairy-Free", "Low Carb", "Keto", "Organic"], defaultValue: ["Vegetarian", "Vegan", "Gluten-Free"], section: "Dietary" },
      { id: "alcoholServed", label: "Alcohol Served", type: "toggle", defaultValue: true, section: "Dietary" },
      // Special
      { id: "specialNotes", label: "Special Notes", type: "textarea", defaultValue: "", placeholder: "e.g., Live music on Fridays, private dining available, seasonal menu changes...", section: "Special" },
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
      // Firm Info
      { id: "firmName", label: "Firm / Practice Name", type: "text", defaultValue: "", placeholder: "e.g., Smith & Associates", section: "Firm Info" },
      { id: "jurisdiction", label: "Primary Jurisdiction", type: "text", defaultValue: "India", section: "Firm Info" },
      { id: "legalArea", label: "Primary Practice Area", type: "select", options: ["Corporate", "Employment", "Real Estate", "Intellectual Property", "Family", "Criminal", "Tax", "Immigration", "Environmental", "Healthcare", "Bankruptcy", "Civil Rights"], defaultValue: "Corporate", section: "Firm Info" },
      { id: "additionalAreas", label: "Additional Practice Areas", type: "multi-select", options: ["Corporate", "Employment", "Real Estate", "Intellectual Property", "Family", "Criminal", "Tax", "Immigration", "Environmental", "Healthcare", "Bankruptcy", "Civil Rights", "Contracts", "Mergers & Acquisitions", "Litigation"], section: "Firm Info" },
      // Consultation
      { id: "consultationType", label: "Consultation Type", type: "select", options: ["Free Initial", "Paid Consultation", "Subscription Based", "Per Case"], defaultValue: "Free Initial", section: "Consultation" },
      { id: "consultationFee", label: "Consultation Fee", type: "text", defaultValue: "", placeholder: "e.g., $200/hour or Free for first 30 min", section: "Consultation" },
      { id: "availableDays", label: "Available Days", type: "multi-select", options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], defaultValue: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], section: "Consultation" },
      { id: "openTime", label: "Office Opens", type: "time", defaultValue: "09:00", section: "Consultation" },
      { id: "closeTime", label: "Office Closes", type: "time", defaultValue: "18:00", section: "Consultation" },
      // Legal Specifics
      { id: "disclaimerText", label: "Custom Disclaimer", type: "textarea", defaultValue: "This service provides general legal information only, not legal advice. Always consult a qualified attorney for your specific situation.", placeholder: "Your legal disclaimer...", section: "Legal Specifics" },
      { id: "documentTypes", label: "Document Types Supported", type: "multi-select", options: ["NDA", "Employment Contract", "Lease Agreement", "Partnership Agreement", "Terms of Service", "Privacy Policy", "Will / Testament", "Power of Attorney", "Complaint / Petition", "Legal Notice"], defaultValue: ["NDA", "Employment Contract", "Terms of Service"], section: "Legal Specifics" },
      { id: "proBonoAvailable", label: "Pro Bono Services Available", type: "toggle", defaultValue: false, section: "Legal Specifics" },
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
