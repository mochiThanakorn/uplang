import { createQuiz } from "../functions/quiz";
import catalog from "../functions/data/oxford.json";

const quiz = createQuiz(catalog);
const key = "uplang:demo:v1";

export function demoApi(action, input) {
  const run = () => {
    const previous = localStorage.getItem(key);
    const { state, response } = quiz.run(JSON.parse(previous), action, input);
    if (!previous || action === "answer" || action === "next") {
      localStorage.setItem(key, JSON.stringify(state));
    }
    return response;
  };

  return navigator.locks ? navigator.locks.request(key, run) : run();
}
