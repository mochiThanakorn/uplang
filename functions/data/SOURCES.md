# Learning content sources

The vocabulary headwords, parts of speech, and CEFR levels follow the Oxford lists linked in the project README. The English `meaning` field retains the original definition data; `meaningTh` is the learner-facing Thai meaning and includes editorial corrections and shorter wording for some entries.

## Example sentences

Each entry records its source in `exampleSource`:

- `WordNet 3.0`: Princeton University WordNet 3.0 examples. The license and copyright notice are included in [WORDNET-LICENSE.txt](WORDNET-LICENSE.txt).
- A Wiktionary URL: attributed to the contributors of the linked English Wiktionary entry, obtained through [Free Dictionary API](https://dictionaryapi.dev/) and the [English Dictionary 1.0.0 dataset](https://github.com/kaysting/english-dictionary/releases/tag/1.0.0). These examples are redistributed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). They have been selected, with initial capitalization and terminal punctuation adjusted where necessary. The `example` text of these entries remains under that license.
- `Uplang`: examples written for this project.

## Thai meanings

Initial Thai meanings were machine translated from the existing public English definitions using Google Translate, then supplemented with editorial corrections, Thai number names, and shorter definitions for selected entries. They are stored locally in `oxford.json`; the running app does not call a translation service.

These learning materials have not received a complete linguistic review. Polysemous words and their example sentences should be reviewed before using the dataset as formal teaching material.
