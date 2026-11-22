const OPTION_COUNT = 8;
const freshRound = () => ({ seen: 0, learned: 0, steps: 0, words: {} });
const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

export class QuizError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function createQuiz(catalog) {
  const words = new Map(catalog.map((word) => [word.id, word]));
  const total = words.size;

  function newQuestion(state) {
    const fresh = [];
    const ready = [];
    const waiting = [];
    for (const word of words.values()) {
      const status = state.round.words[word.id];
      if (status === undefined) fresh.push(word);
      else if (status !== -1) (status <= state.round.steps ? ready : waiting).push(word);
    }

    // Mix retries into subsequent questions. When only delayed words remain,
    // prioritize an intervening word whenever there is one.
    const pool = ready.length && (!fresh.length || Math.random() < 0.35)
      ? ready : fresh.length ? fresh : waiting;
    const alternatives = pool.filter((word) => word.id !== state.current?.wordId);
    const word = randomItem(alternatives.length ? alternatives : pool);
    const similar = catalog.filter((entry) => entry.pos === word.pos);
    const distractors = [...similar, ...catalog.filter((entry) => entry.pos !== word.pos)];
    const options = [{ id: word.id, label: word.meaningTh }];
    const labels = new Set([word.meaningTh.trim()]);
    for (let i = 0; i < distractors.length && options.length < OPTION_COUNT; i++) {
      const end = i < similar.length ? similar.length : distractors.length;
      const j = i + Math.floor(Math.random() * (end - i));
      [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
      const other = distractors[i];
      const label = other.meaningTh.trim();
      if (other.word === word.word || labels.has(label)) continue;
      labels.add(label);
      options.push({ id: other.id, label: other.meaningTh });
    }
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    // Use an opaque, per-question identifier for each choice.
    state.current = {
      id: globalThis.crypto.randomUUID(),
      wordId: word.id,
      options: options.map((option, i) => ({ key: String(i + 1), ...option })),
    };
  }

  function summary(state) {
    return {
      total, round: state.number, seen: state.round.seen, learned: state.round.learned,
      correct: state.correct, wrong: state.wrong,
      review: state.round.seen - state.round.learned,
      streak: state.streak,
      complete: state.round.learned === total,
    };
  }

  function view(state) {
    if (!state.current) return { question: null, result: null, summary: summary(state) };
    const { id, wordId, options, selected } = state.current;
    const { word, pos, level, meaningTh, context, example, exampleTh } = words.get(wordId);
    const correct = options.find((option) => option.id === wordId).key;
    return {
      // Resolve labels from the catalog so saved questions also use Thai choices.
      question: { id, word, pos, level, context, example, options: options.map(({ key, id }) => ({ key, label: words.get(id).meaningTh })) },
      result: selected === undefined ? null : {
        selected, correct, meaning: meaningTh,
        ...(selected === correct ? { exampleTh } : {}),
      },
      summary: summary(state),
    };
  }

  return {
    run(state, action, input = {}) {
      if (!state) {
        state = { number: 1, correct: 0, wrong: 0, streak: 0, round: freshRound(), stats: {} };
        newQuestion(state);
      }
      if (action === "stats") {
        const rows = Object.entries(state.stats).map(([id, stats]) => {
          const { word, pos, level, context } = words.get(id);
          return { id, word, pos, level, context, ...stats };
        });
        return { state, response: { summary: summary(state), rows } };
      }

      const current = state.current;
      if (action === "answer") {
        if (current.id !== input.id) throw new QuizError(409, "คำถามเปลี่ยนแล้ว ลองโหลดคำถามล่าสุด");
        const choice = current.options.find((option) => option.key === input.choice);
        if (!choice) throw new QuizError(400, "กรุณาเลือกคำตอบที่อยู่ในรายการ");
        if (current.selected === undefined) {
          const id = current.wordId;
          const round = state.round;
          const stats = state.stats[id] ?? { correct: 0, wrong: 0 };
          const correct = choice.id === id;
          const field = correct ? "correct" : "wrong";
          if (round.words[id] === undefined) round.seen++;
          round.steps++;
          round.words[id] = correct ? -1 : round.steps + 3 + Math.floor(Math.random() * 5);
          if (correct) round.learned++;
          current.selected = choice.key;
          stats[field]++;
          state.stats[id] = stats;
          state[field]++;
          state.streak = correct ? state.streak + 1 : 0;
        }
      }

      if (action === "next" && current.id === input.id && current.selected !== undefined) {
        if (state.round.learned === total) {
          state.number++;
          state.round = freshRound();
        }
        newQuestion(state);
      }

      return { state, response: view(state) };
    },
  };
}
