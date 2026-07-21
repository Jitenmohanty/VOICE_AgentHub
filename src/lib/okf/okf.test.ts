import { describe, it, expect } from "vitest";
import { serializeFrontmatter, parseFrontmatter } from "./frontmatter";
import { contentHash } from "./hash";
import {
  serializeAgentKnowledge,
  serializeBusinessData,
  serializeAgentCard,
  type OkfKnowledgeInput,
} from "./serialize";
import {
  parseOkfBundle,
  conceptToKnowledgeItem,
  conceptToBusinessData,
  type OkfConcept,
} from "./parse";

const AGENT = { name: "Grand Hotel", slug: "grand-hotel", templateType: "hotel" };
const NOW = "2026-07-21T00:00:00.000Z";

const items: OkfKnowledgeInput[] = [
  {
    id: "clx001",
    title: "Check-in Time",
    content: "Check-in is from 2 PM. Early check-in on request.",
    category: "faq",
    sourceType: "FAQ",
    metadata: { tags: ["timing", "arrival"] },
  },
  {
    id: "clx002",
    title: "Cancellation Policy",
    content: "Free cancellation up to 48 hours before arrival.",
    category: "policy",
    sourceType: "TEXT",
    metadata: null,
  },
];

describe("frontmatter", () => {
  it("round-trips scalars and arrays", () => {
    const fm = serializeFrontmatter({ type: "knowledge", title: "Hi", tags: ["a", "b"] });
    const { data, body } = parseFrontmatter(`---\n${fm}\n---\n\nBody here`);
    expect(data.type).toBe("knowledge");
    expect(data.title).toBe("Hi");
    expect(data.tags).toEqual(["a", "b"]);
    expect(body).toBe("Body here");
  });

  it("quotes and recovers values with YAML-significant characters", () => {
    const fm = serializeFrontmatter({ title: "Rooms: Deluxe, King & Suite #1" });
    const { data } = parseFrontmatter(`---\n${fm}\n---\n`);
    expect(data.title).toBe("Rooms: Deluxe, King & Suite #1");
  });

  it("handles a quoted comma inside an array element", () => {
    const fm = serializeFrontmatter({ tags: ["a, b", "c"] });
    const { data } = parseFrontmatter(`---\n${fm}\n---\n`);
    expect(data.tags).toEqual(["a, b", "c"]);
  });

  it("never throws on missing frontmatter", () => {
    expect(parseFrontmatter("just a plain body")).toEqual({ data: {}, body: "just a plain body" });
    expect(parseFrontmatter("")).toEqual({ data: {}, body: "" });
  });
});

describe("hash", () => {
  it("is stable and content-sensitive", () => {
    expect(contentHash("abc")).toBe(contentHash("abc"));
    expect(contentHash("abc")).not.toBe(contentHash("abd"));
  });
});

describe("serialize → parse → map round-trip", () => {
  it("reconstructs the core KnowledgeItem fields", () => {
    const bundle = serializeAgentKnowledge(AGENT, items, NOW);
    const concepts = parseOkfBundle(bundle);
    const drafts = concepts
      .map(conceptToKnowledgeItem)
      .filter((d): d is NonNullable<typeof d> => d !== null);

    expect(drafts).toHaveLength(2);

    const byId = Object.fromEntries(drafts.map((d) => [d.id, d]));
    const a = byId["clx001"]!;
    const b = byId["clx002"]!;
    expect(a).toMatchObject({
      id: "clx001",
      title: "Check-in Time",
      content: "Check-in is from 2 PM. Early check-in on request.",
      category: "faq",
      sourceType: "FAQ",
    });
    expect(a.metadata.tags).toEqual(["timing", "arrival"]);
    expect(b).toMatchObject({
      id: "clx002",
      category: "policy",
      sourceType: "TEXT",
    });
    // content_hash survives the round-trip (drives skip-unchanged on re-import)
    expect(a.metadata.contentHash).toBe(contentHash(items[0]!.content));
  });

  it("writes a README manifest and one file per active item", () => {
    const bundle = serializeAgentKnowledge(AGENT, items, NOW);
    expect(bundle["README.md"]).toContain("Grand Hotel");
    expect(Object.keys(bundle).filter((k) => k.startsWith("concepts/"))).toHaveLength(2);
  });

  it("skips inactive items", () => {
    const bundle = serializeAgentKnowledge(
      AGENT,
      [...items, { id: "clx003", title: "Old", content: "x", category: "faq", isActive: false }],
      NOW,
    );
    expect(Object.keys(bundle).filter((k) => k.startsWith("concepts/"))).toHaveLength(2);
  });

  it("de-duplicates filenames for same category+title", () => {
    const dupes: OkfKnowledgeInput[] = [
      { id: "a", title: "Hours", content: "9-5", category: "faq" },
      { id: "b", title: "Hours", content: "10-6", category: "faq" },
    ];
    const bundle = serializeAgentKnowledge(AGENT, dupes, NOW);
    const concepts = bundle;
    expect(Object.keys(concepts).filter((k) => k.startsWith("concepts/"))).toEqual([
      "concepts/faq-hours.md",
      "concepts/faq-hours-2.md",
    ]);
  });
});

describe("PII exclusion (security invariant)", () => {
  it("never serializes non-knowledge fields even if present on the input", () => {
    const poisoned = [
      {
        ...items[0],
        // fields that must NEVER appear in a bundle:
        email: "victim@example.com",
        phone: "+15551234567",
        capturedLead: { name: "Jane", phone: "+15559999999" },
        ownerId: "user_secret",
        transcript: "sensitive call transcript",
      },
    ] as unknown as OkfKnowledgeInput[];

    const serialized = JSON.stringify(serializeAgentKnowledge(AGENT, poisoned, NOW));
    for (const leak of [
      "victim@example.com",
      "+15551234567",
      "+15559999999",
      "capturedLead",
      "user_secret",
      "sensitive call transcript",
    ]) {
      expect(serialized).not.toContain(leak);
    }
  });
});

describe("parse resilience", () => {
  it("ignores README and non-markdown files", () => {
    const concepts = parseOkfBundle({
      "README.md": "---\ntype: knowledge\n---\nshould be ignored",
      "notes.txt": "---\ntype: knowledge\n---\nalso ignored",
      "concepts/x.md": "---\ntype: knowledge\ntitle: X\n---\nreal",
    });
    expect(concepts).toHaveLength(1);
    expect(concepts[0]!.title).toBe("X");
  });

  it("skips files with no `type` field (OKF requires it)", () => {
    const concepts = parseOkfBundle({ "concepts/x.md": "---\ntitle: No Type\n---\nbody" });
    expect(concepts).toHaveLength(0);
  });

  it("returns null for non-knowledge concept types", () => {
    const c: OkfConcept = { type: "agent", title: "Card", tags: [], body: "x", path: "agent.md" };
    expect(conceptToKnowledgeItem(c)).toBeNull();
  });

  it("hand-authored file (no voxie_id/source) defaults to OKF source, no id (knowledge)", () => {
    const c = parseOkfBundle({
      "concepts/new.md": "---\ntype: knowledge\ntitle: New\ncategory: service\n---\nHand written.",
    })[0]!;
    const draft = conceptToKnowledgeItem(c)!;
    expect(draft.id).toBeUndefined();
    expect(draft.sourceType).toBe("OKF");
    expect(draft.category).toBe("service");
    expect(draft.content).toBe("Hand written.");
    expect(draft.metadata.contentHash).toBe(contentHash("Hand written."));
  });
});

describe("Phase 3 — BusinessData round-trip", () => {
  const dataItems = [
    { id: "bd1", dataType: "menu", data: { items: [{ name: "Latte", price: 4.5 }] } },
    { id: "bd2", dataType: "rooms", data: { rooms: [{ type: "Deluxe", rate: 200 }] } },
  ];

  it("serializes each row to data/*.md and round-trips the JSON losslessly", () => {
    const files = serializeBusinessData(dataItems);
    expect(Object.keys(files).sort()).toEqual(["data/menu.md", "data/rooms.md"]);

    const drafts = parseOkfBundle(files)
      .map(conceptToBusinessData)
      .filter((d): d is NonNullable<typeof d> => d !== null);

    expect(drafts).toHaveLength(2);
    const byType = Object.fromEntries(drafts.map((d) => [d.dataType, d.data]));
    expect(byType["menu"]).toEqual({ items: [{ name: "Latte", price: 4.5 }] });
    expect(byType["rooms"]).toEqual({ rooms: [{ type: "Deluxe", rate: 200 }] });
  });

  it("knowledge and businessdata concepts don't cross-map", () => {
    const files = serializeBusinessData(dataItems);
    const concepts = parseOkfBundle(files);
    // businessdata concepts are NOT knowledge items…
    expect(concepts.map(conceptToKnowledgeItem).filter(Boolean)).toHaveLength(0);
    // …and knowledge concepts are NOT businessdata.
    const kb = serializeAgentKnowledge(AGENT, items, NOW);
    expect(parseOkfBundle(kb).map(conceptToBusinessData).filter(Boolean)).toHaveLength(0);
  });

  it("returns null for a businessdata concept with a broken JSON block", () => {
    const [c] = parseOkfBundle({
      "data/bad.md": "---\ntype: businessdata\ndata_type: menu\n---\n```json\n{ not valid\n```",
    });
    expect(conceptToBusinessData(c!)).toBeNull();
  });
});

describe("Phase 3 — agent card", () => {
  it("exports agent config to agent.md and is ignored by both importers", () => {
    const files = serializeAgentCard({
      name: "Front Desk",
      templateType: "hotel",
      greeting: "Welcome!",
      personality: "Warm and concise.",
      systemPrompt: "You are the front desk.",
      voiceName: "Puck",
      language: "en-US",
      enabledTools: ["listRooms"],
    });
    expect(files["agent.md"]).toContain("You are the front desk.");
    expect(files["agent.md"]).toContain("Front Desk");

    const concepts = parseOkfBundle(files);
    expect(concepts).toHaveLength(1);
    expect(concepts[0]!.type).toBe("agent");
    // Export-only: an agent card never becomes a knowledge item or business data.
    expect(conceptToKnowledgeItem(concepts[0]!)).toBeNull();
    expect(conceptToBusinessData(concepts[0]!)).toBeNull();
  });
});
