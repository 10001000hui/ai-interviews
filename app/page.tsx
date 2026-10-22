"use client";

import { useState } from "react";

// 展示積木：使用者輸入 → 送到 /api/interview → 顯示 AI 結果

const DIFFICULTIES = [
  { value: "junior", label: "初階" },
  { value: "mid", label: "中階" },
  { value: "senior", label: "進階" },
];

// 本機開發時允許不填 Key，後端會改用 .env.local 的 OPENAI_API_KEY；部署後一定要填
const IS_DEV = process.env.NODE_ENV === "development";

async function callApi(apiKey: string, payload: Record<string, string>) {
  const res = await fetch("/api/interview", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-openai-key": apiKey },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "發生錯誤");
  return data;
}

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [job, setJob] = useState("");
  const [difficulty, setDifficulty] = useState("junior");
  const [questions, setQuestions] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generateQuestions() {
    setError("");
    setLoading(true);
    try {
      const data = await callApi(apiKey, { action: "questions", job, difficulty });
      setQuestions(data.questions);
      setCurrent(0);
      setAnswer("");
      setFeedback("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function getFeedback() {
    setError("");
    setLoading(true);
    try {
      const data = await callApi(apiKey, {
        action: "feedback",
        job,
        difficulty,
        question: questions[current],
        answer,
      });
      setFeedback(data.feedback);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function goTo(index: number) {
    setCurrent(index);
    setAnswer("");
    setFeedback("");
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
  const buttonClass =
    "rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">🎤 AI 面試模擬器</h1>
          <p className="text-zinc-600">
            輸入想應徵的職位、選擇難度，AI 面試官會出題，並針對你的回答給分與建議。
          </p>
        </header>

        <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="apiKey">
              OpenAI API Key（BYOK）
            </label>
            <input
              id="apiKey"
              type="password"
              autoComplete="off"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className={inputClass}
            />
            <p className="text-xs text-zinc-500">
              本網站採用「使用者自備 API Key」模式。Key 只存在這個頁面的記憶體中，重新整理就會清除，伺服器不會儲存。
            </p>
            {IS_DEV && (
              <p className="text-xs text-amber-600">
                本機開發模式：留空會使用 .env.local 裡的 OPENAI_API_KEY（只在你的電腦有效，部署後不會生效）。
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="job">
              想應徵的職位
            </label>
            <input
              id="job"
              placeholder="例如：前端工程師、行銷企劃、產品經理"
              value={job}
              onChange={(e) => setJob(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <span className="text-sm font-medium">難度</span>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                    difficulty === d.value
                      ? "border-indigo-600 bg-indigo-50 font-medium text-indigo-700"
                      : "border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generateQuestions}
            disabled={loading || (!apiKey && !IS_DEV) || !job.trim()}
            className={`${buttonClass} w-full`}
          >
            {loading && questions.length === 0 ? "AI 出題中…" : "產生面試題目"}
          </button>
        </section>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {questions.length > 0 && (
          <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-9 w-9 rounded-full text-sm ${
                    i === current
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <p className="text-lg font-medium">
              Q{current + 1}. {questions[current]}
            </p>

            <textarea
              rows={6}
              placeholder="在這裡輸入你的回答…"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className={inputClass}
            />

            <div className="flex gap-2">
              <button
                onClick={getFeedback}
                disabled={loading || !answer.trim()}
                className={buttonClass}
              >
                {loading ? "AI 評分中…" : "送出回答，取得回饋"}
              </button>
              {current < questions.length - 1 && (
                <button
                  onClick={() => goTo(current + 1)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 hover:bg-zinc-50"
                >
                  下一題 →
                </button>
              )}
            </div>

            {feedback && (
              <div className="whitespace-pre-wrap rounded-lg bg-indigo-50 p-4 text-sm leading-relaxed text-zinc-800">
                {feedback}
              </div>
            )}
          </section>
        )}

        <footer className="text-center text-xs text-zinc-400">
          Next.js 前端 → API Route 後端 → OpenAI API
        </footer>
      </div>
    </main>
  );
}
