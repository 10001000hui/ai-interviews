import OpenAI from "openai";

// 邏輯積木：前端不能直接碰 AI，所有 OpenAI 呼叫都在這裡進行。
// BYOK 模式：API Key 由使用者在前端輸入，透過 header 傳進來，
// 伺服器只拿來呼叫一次 OpenAI，不儲存、不寫進 log。

const MODEL = "gpt-5.4-mini";

const DIFFICULTY_LABEL: Record<string, string> = {
  junior: "初階（新鮮人／1-2 年經驗）",
  mid: "中階（3-5 年經驗）",
  senior: "進階（資深／主管職）",
};

type QuestionsBody = {
  action: "questions";
  job: string;
  difficulty: string;
};

type FeedbackBody = {
  action: "feedback";
  job: string;
  difficulty: string;
  question: string;
  answer: string;
};

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-openai-key")?.trim();
  if (!apiKey) {
    return Response.json({ error: "請先輸入你的 OpenAI API Key。" }, { status: 400 });
  }

  let body: QuestionsBody | FeedbackBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "請求格式錯誤。" }, { status: 400 });
  }

  const job = body.job?.trim().slice(0, 100);
  const difficulty = DIFFICULTY_LABEL[body.difficulty] ? body.difficulty : "junior";
  if (!job) {
    return Response.json({ error: "請輸入想應徵的職位。" }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });

  try {
    if (body.action === "questions") {
      const response = await client.responses.create({
        model: MODEL,
        instructions:
          "你是一位專業的面試官。請用繁體中文出題。只輸出 JSON，格式為 {\"questions\": [\"題目1\", ...]}，不要有其他文字。",
        input: `職位：${job}\n難度：${DIFFICULTY_LABEL[difficulty]}\n請出 5 題面試題目，混合專業能力、情境題與行為題。`,
      });
      const questions = parseQuestions(response.output_text);
      if (questions.length === 0) {
        return Response.json({ error: "AI 回傳格式異常，請再試一次。" }, { status: 502 });
      }
      return Response.json({ questions });
    }

    if (body.action === "feedback") {
      const question = body.question?.trim().slice(0, 500);
      const answer = body.answer?.trim().slice(0, 3000);
      if (!question || !answer) {
        return Response.json({ error: "請先輸入你的回答。" }, { status: 400 });
      }
      const response = await client.responses.create({
        model: MODEL,
        instructions:
          "你是一位友善但嚴格的面試官。請用繁體中文，針對應徵者的回答給予回饋，格式如下：\n" +
          "分數：X / 10\n優點：...\n可改進：...\n參考回答：...\n" +
          "每個段落簡潔，總長度不超過 300 字。",
        input: `職位：${job}\n難度：${DIFFICULTY_LABEL[difficulty]}\n題目：${question}\n應徵者回答：${answer}`,
      });
      return Response.json({ feedback: response.output_text });
    }

    return Response.json({ error: "未知的操作。" }, { status: 400 });
  } catch (err) {
    if (err instanceof OpenAI.AuthenticationError) {
      return Response.json({ error: "API Key 無效，請確認後再試。" }, { status: 401 });
    }
    if (err instanceof OpenAI.RateLimitError) {
      return Response.json(
        { error: "OpenAI 額度不足或請求太頻繁，請確認帳戶餘額後再試。" },
        { status: 429 },
      );
    }
    if (err instanceof OpenAI.APIError) {
      return Response.json({ error: `OpenAI 錯誤：${err.message}` }, { status: 502 });
    }
    return Response.json({ error: "伺服器發生錯誤，請稍後再試。" }, { status: 500 });
  }
}

function parseQuestions(text: string): string[] {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return [];
  try {
    const data = JSON.parse(match[0]);
    return Array.isArray(data.questions)
      ? data.questions.filter((q: unknown): q is string => typeof q === "string")
      : [];
  } catch {
    return [];
  }
}
