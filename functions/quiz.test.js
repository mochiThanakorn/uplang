import assert from "node:assert/strict";
import test from "node:test";
import catalog from "./catalog.js";
import { createQuiz, QuizError } from "./quiz.js";

const quiz = createQuiz(catalog);

test("every word has a Thai meaning and a translated example", () => {
  for (const entry of catalog) {
    assert.match(entry.meaningTh, /[\u0e00-\u0e7f]/, entry.word);
    const label = entry.choiceTh ?? entry.meaningTh;
    assert.match(label, /[\u0e00-\u0e7f]/, entry.word);
    assert(label.length <= 60, `${entry.word}: choice is too long`);
    assert(entry.example.trim().split(/\s+/).length >= 4, entry.word);
    assert.match(entry.example, /[.!?]["']?$/, entry.word);
    assert(entry.exampleSource, entry.word);
    assert.match(entry.exampleTh, /[\u0e00-\u0e7f]/, entry.word);
  }
});

test("compact choices replace saved labels while the result retains the full meaning", () => {
  const { state } = quiz.run(null, "question");
  const water = catalog.find((entry) => entry.word === "water");
  state.current.wordId = water.id;
  state.current.options = [{ key: "1", id: water.id, label: water.meaningTh }];
  const { response } = answer(state, true);
  assert.equal(response.question.options[0].label, "น้ำ");
  assert.equal(response.result.meaning, water.meaningTh);
});

test("saved choices that now share a compact translation stay distinguishable", () => {
  const entries = catalog.slice(0, 8).map((entry, i) => ({
    ...entry, choiceTh: i < 2 ? "คำแปลเดียวกัน" : `คำแปล ${i}`,
    meaningTh: `ความหมายเต็ม ${i}`,
  }));
  const savedQuiz = createQuiz(entries);
  const { state } = savedQuiz.run(null, "question");
  state.current.options = entries.map((entry, i) => ({ key: String(i + 1), id: entry.id }));
  const questionId = state.current.id;
  const { response } = savedQuiz.run(state, "question");
  assert.equal(response.question.id, questionId);
  assert.equal(new Set(response.question.options.map(({ label }) => label)).size, 8);
  assert.equal(response.question.options[0].label, entries[0].meaningTh);
  assert.equal(response.question.options[1].label, entries[1].meaningTh);
  assert.deepEqual(response.question.options.map(({ key }) => key), state.current.options.map(({ key }) => key));
  assert.equal(response.summary.seen, 0);
});

test("saved questions resolve Thai options without resetting progress", () => {
  const { state } = quiz.run(null, "question");
  const questionId = state.current.id;
  for (const option of state.current.options) option.label = "Old English definition";
  const { response } = answer(state, true);
  assert.equal(response.question.id, questionId);
  assert.equal(response.question.example, catalog.find((entry) => entry.id === state.current.wordId).example);
  assert(response.question.options.every((option) => /[\u0e00-\u0e7f]/.test(option.label)));
  assert.match(response.result.meaning, /[\u0e00-\u0e7f]/);
  assert.equal(response.result.exampleTh, catalog.find((entry) => entry.id === state.current.wordId).exampleTh);
  assert.equal(quiz.run(state, "question").response.result.exampleTh, response.result.exampleTh);
  assert.equal(response.summary.correct, 1);
  assert.equal(response.summary.learned, 1);
});

function answer(state, correct) {
  const { id, wordId, options } = state.current;
  const choice = options.find((option) => (option.id === wordId) === correct);
  return quiz.run(state, "answer", { id, choice: choice.key });
}

function next(state) {
  return quiz.run(state, "next", { id: state.current.id });
}

test("all 5,000 entries are answered once, then a new round retains lifetime stats", () => {
  const seen = new Set();
  let { state, response } = quiz.run(null, "question");
  assert.equal(response.summary.total, 5_000);
  for (let i = 0; i < 5_000; i++) {
    assert(!seen.has(state.current.wordId));
    seen.add(state.current.wordId);
    assert.equal(response.question.options.length, 8);
    assert.equal(new Set(response.question.options.map((option) => option.label.toLowerCase())).size, 8);
    assert(response.question.options.every((option) => option.label.length <= 60));
    assert.equal(response.result, null);
    assert(response.question.options.every((option) => Object.keys(option).sort().join() === "key,label"));

    ({ state, response } = answer(state, true));
    assert.equal(response.summary.learned, i + 1);
    assert.equal(response.result.selected, response.result.correct);
    if (i < 4_999) ({ state, response } = next(state));
  }

  assert.equal(response.summary.complete, true);
  const previousQuestion = state.current.id;
  ({ state, response } = next(state));
  assert.equal(response.summary.round, 2);
  assert.equal(response.summary.learned, 0);
  assert.equal(response.summary.correct, 5_000);
  assert.equal(quiz.run(state, "next", { id: previousQuestion }).response.question.id, state.current.id);
  assert.equal(quiz.run(state, "stats").response.rows.length, 5_000);
});

test("wrong answers reveal the correct choice, count once and return after other questions", () => {
  const smallQuiz = createQuiz(catalog.slice(0, 8));
  let { state } = smallQuiz.run(null, "question");
  const { wordId, id, options } = state.current;
  const wrong = options.find((option) => option.id !== wordId).key;
  const right = options.find((option) => option.id === wordId).key;
  const first = smallQuiz.run(state, "answer", { id, choice: wrong }).response;
  assert.equal(first.result.correct, right);
  assert.equal(first.result.selected, wrong);
  assert.equal(first.result.exampleTh, catalog.find((entry) => entry.id === wordId).exampleTh);
  assert.equal(first.summary.review, 1);
  assert.equal(first.summary.seen, 1);
  assert.equal(first.summary.learned, 0);
  assert.equal(smallQuiz.run(state, "answer", { id, choice: right }).response.summary.wrong, 1);

  ({ state } = smallQuiz.run(state, "next", { id }));
  assert.throws(() => smallQuiz.run(state, "answer", { id, choice: right }), (error) => error instanceof QuizError && error.status === 409);
  let intervening = 0;
  while (state.current.wordId !== wordId && intervening < 8) {
    const question = state.current;
    const correct = question.options.find((option) => option.id === question.wordId).key;
    smallQuiz.run(state, "answer", { id: question.id, choice: correct });
    ({ state } = smallQuiz.run(state, "next", { id: question.id }));
    intervening++;
  }
  assert(intervening >= 3);
  assert.equal(state.current.wordId, wordId);
  const retry = state.current;
  smallQuiz.run(state, "answer", { id: retry.id, choice: retry.options.find((option) => option.id === wordId).key });
  const { rows, summary } = smallQuiz.run(state, "stats").response;
  const record = rows.find((row) => row.id === wordId);
  assert.equal(record.correct, 1);
  assert.equal(record.wrong, 1);
  assert.equal(summary.review, 0);
});
