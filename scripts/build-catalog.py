"""Build functions/data/oxford.json from layout-extracted Oxford PDFs and WordNet 3.0."""
import argparse
import collections
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POS = {
    "n.": "noun", "noun.": "noun", "v.": "verb", "adj.": "adjective", "adv.": "adverb",
    "auxiliary v.": "auxiliary verb", "modal v.": "modal verb", "prep.": "preposition",
    "pron.": "pronoun", "det.": "determiner", "conj.": "conjunction", "exclam.": "interjection",
    "number": "number", "indefinite article": "indefinite article",
    "definite article": "definite article", "infinitive marker": "infinitive marker",
}
LEVEL = r"[ABC][12]"
POS_PATTERN = "|".join(map(re.escape, sorted(POS, key=len, reverse=True)))
ENTRY = re.compile(rf"^([A-Za-z].*?)\s+({POS_PATTERN})(?=[, /]|$)")
WN_POS = {"noun": "noun", "verb": "verb", "adjective": "adj", "adverb": "adv"}


def read_oxford(path):
    pending = ""
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith(("©", "The Oxford", "3000, it")):
            continue
        pending = f"{pending} {line}".strip()
        if not re.search(rf"\b{LEVEL}$", pending):
            continue
        match = ENTRY.match(pending)
        if not match:
            raise ValueError(pending)
        headword, pos = match.groups()
        word = re.sub(r"\d+(?=\s|$)", "", headword.split(" (")[0]).replace("™", "")
        level = re.search(LEVEL, pending[match.end():]).group()
        # The supplementary PDF labels this adjective as a noun.
        if word == "diplomatic":
            pos = "adj."
        yield word, POS[pos], level, headword
        pending = ""
    if pending:
        raise ValueError(pending)


def read_wordnet(directory):
    results = {}
    for pos, file_pos in WN_POS.items():
        glosses = {}
        with (directory / f"data.{file_pos}").open(encoding="latin-1") as source:
            for line in source:
                if not line[0].isdigit():
                    continue
                entry, gloss = line.split("|", 1)
                definition = gloss.split('; "')[0].strip()
                glosses[entry.split()[0]] = definition
        with (directory / f"index.{file_pos}").open(encoding="latin-1") as source:
            for line in source:
                if line.startswith(" "):
                    continue
                word, _, count, *fields = line.split()
                results[word.replace("_", " "), pos] = [glosses[offset] for offset in fields[-int(count):]]
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("oxford3000", type=Path)
    parser.add_argument("oxford5000", type=Path)
    parser.add_argument("wordnet_dict", type=Path)
    args = parser.parse_args()
    # Keep the Thai translations and examples when rebuilding the Oxford list.
    output = ROOT / "functions/data/oxford.json"
    learning_fields = ("meaningTh", "example", "exampleSource", "exampleTh")
    def learning_key(entry):
        return entry["word"], entry["pos"], entry.get("context", "")
    learning = {
        learning_key(entry): {key: entry[key] for key in learning_fields if key in entry}
        for entry in json.loads(output.read_text())
    } if output.exists() else {}
    wordnet = read_wordnet(args.wordnet_dict)
    overrides = {}
    for line in (ROOT / "scripts/definitions.tsv").read_text().splitlines():
        key, meaning, *context = line.split("\t")
        overrides[key] = {"skip": True} if meaning == "@skip" else {"meaning": meaning}
        if context:
            overrides[key]["context"] = context[0]
    entries = list(dict.fromkeys([*read_oxford(args.oxford3000), *read_oxford(args.oxford5000)]))
    catalog, missing = [], []
    for word, pos, level, original in entries:
        key = f"{original}|{pos}"
        meanings = wordnet.get((word.lower(), pos), [])
        override = overrides.get(key, overrides.get(original, {}))
        if override.get("skip"):
            continue
        if "meaning" in override:
            meaning = override["meaning"]
        elif meanings:
            meaning = meanings[0]
        else:
            missing.append((key, level))
            continue
        entry = {"id": str(len(catalog) + 1), "word": word, "pos": pos, "level": level, "meaning": meaning[:1].upper() + meaning[1:]}
        if "context" in override:
            entry["context"] = override["context"]
        entry.update(learning.get(learning_key(entry), {}))
        if not all(entry.get(key) for key in learning_fields):
            raise ValueError(f"Missing Thai translation or example for {key}; add learning data before rebuilding")
        catalog.append(entry)
    print(f"{len(entries)} entries, {len(missing)} missing definitions")
    for key, level in missing:
        print(key, level)
    for word, count in collections.Counter(row[0] for row in entries).items():
        if count > 1:
            print("REPEATED", word, [row for row in entries if row[0] == word])
    if missing:
        return 1
    if len(catalog) != 5000:
        raise ValueError(f"Expected 5,000 quiz entries, found {len(catalog)}")
    content = ",\n".join(json.dumps(item, ensure_ascii=False, separators=(",", ":")) for item in catalog)
    output.write_text(f"[\n{content}\n]\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
