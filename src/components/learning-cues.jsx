import { Badge } from "@/components/ui/badge";

const wordTypes = {
  noun: { tone: "noun", label: "คำนาม" },
  verb: { tone: "verb", label: "คำกริยา" },
  "modal verb": { tone: "verb", label: "กริยาช่วย" },
  adjective: { tone: "adjective", label: "คำคุณศัพท์" },
  adverb: { tone: "adverb", label: "คำกริยาวิเศษณ์" },
};

export function WordTypeBadge({ pos }) {
  const type = wordTypes[pos];
  return <Badge variant="outline" className="word-type" data-tone={type?.tone}>
    <span lang="en">{pos}</span>{type && <span lang="th">· {type.label}</span>}
  </Badge>;
}

export function WordTypeLegend() {
  return <div className="word-type-legend" aria-label="สีแยกชนิดคำ">
    {["noun", "verb", "adjective", "adverb"].map((pos) => <WordTypeBadge key={pos} pos={pos} />)}
  </div>;
}

export function ExampleSentence({ text, word }) {
  // Match complete words, preserving punctuation and the original sentence.
  const terms = word.split(",").map((term) => term.trim()).filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!terms.length) return text;
  const parts = text.split(new RegExp(`\\b(${terms.join("|")})\\b`, "gi"));
  return parts.map((part, index) => index % 2
    ? <mark className="example-target" key={index}>{part}</mark> : part);
}
