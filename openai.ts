import { ExamQuestion } from "./types";

const DEFAULT_MODEL = "gpt-5.4";
const DEFAULT_BASE_URL = "https://new.fastaicode.top";

const questionFields = [
  "questionType",
  "applicableType",
  "questionTitle",
  "fileUrl",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "optionE",
  "optionF",
  "answer",
] as const;

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getEnvValue = (viteName: string, processValue?: string) => {
  const viteEnv = (import.meta as any).env?.[viteName];
  return viteEnv || processValue || "";
};

const buildChatCompletionsUrl = (baseUrl?: string) => {
  const rawBaseUrl =
    baseUrl?.trim() ||
    getEnvValue("VITE_OPENAI_BASE_URL", process.env.OPENAI_BASE_URL) ||
    DEFAULT_BASE_URL;
  const normalized = rawBaseUrl.replace(/\/+$/, "");

  if (normalized.endsWith("/v1/chat/completions")) {
    return normalized;
  }

  if (normalized.endsWith("/chat/completions")) {
    return normalized;
  }

  if (normalized.endsWith("/v1")) {
    return `${normalized}/chat/completions`;
  }

  return `${normalized}/v1/chat/completions`;
};

const examQuestionSchema = {
  name: "exam_questions",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["questions"],
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [...questionFields],
          properties: Object.fromEntries(
            questionFields.map((field) => [field, { type: "string" }])
          ),
        },
      },
    },
  },
};

const parseResponseText = (text: string): ExamQuestion[] => {
  const cleanText = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");

  const parsed = JSON.parse(cleanText);
  if (Array.isArray(parsed)) {
    return parsed as ExamQuestion[];
  }

  if (Array.isArray(parsed.questions)) {
    return parsed.questions as ExamQuestion[];
  }

  throw new Error("模型返回的 JSON 格式不正确。");
};

export const parseExamContent = async (
  textInput: string,
  files: File[],
  apiKey?: string,
  baseUrl?: string
): Promise<ExamQuestion[]> => {
  const key =
    apiKey?.trim() ||
    getEnvValue("VITE_OPENAI_API_KEY", process.env.OPENAI_API_KEY).trim();

  if (!key) {
    throw new Error("请提供 OpenAI API Key。");
  }

  const promptText = `
你是一个专业的考试题库数据提取助手。请分析用户提供的图片和/或文本，把其中的试题提取为结构化 JSON。

必须将每一道题归类到以下四种题型之一，并原样写入 questionType：
1. "单选题"
2. "多选题"
3. "判断题"
4. "简答题"

字段要求：
- questionType：只能使用以上四种题型。如果标题只写“选择题”，请根据答案数量判断单选或多选；不确定时默认“单选题”。
- applicableType：默认填写“生产保障”，除非题目明确给出其他适用类型。
- questionTitle：题干正文，删除开头题号，例如“1.”、“2、”。
- fileUrl：没有明确 URL 时留空字符串。
- optionA 到 optionF：对应选项内容；没有选项时留空字符串。
- answer：标准答案，例如“A”、“ABC”、“√”、“×”或简答题答案。

只返回符合 schema 的 JSON，不要输出解释文字。
${textInput.trim() ? `\n用户粘贴的文本：\n${textInput}` : ""}
`;

  const content: any[] = [{ type: "text", text: promptText }];

  for (const file of files) {
    if (file.type.startsWith("image/")) {
      content.push({
        type: "image_url",
        image_url: {
          url: await fileToDataUrl(file),
        },
      });
    }
  }

  const requestUrl = buildChatCompletionsUrl(baseUrl);
  let response: Response;

  try {
    response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: "你负责把考试资料精准提取成可导入题库的结构化数据。",
          },
          {
            role: "user",
            content,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: examQuestionSchema,
        },
      }),
    });
  } catch (error) {
    console.error("OpenAI fetch failed:", error);
    throw new Error(
      `无法连接到请求地址：${requestUrl}。如果直接填写中转站地址时出现 Failed to fetch，通常是浏览器跨域限制；本地开发请使用 /api/openai 代理，部署后需要后端代理或让中转站放行部署域名。`
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    let message = errorText;

    try {
      const errorJson = JSON.parse(errorText);
      message = errorJson.error?.message || errorJson.message || errorText;
    } catch {
      // Keep the plain response text when the server does not return JSON.
    }

    throw new Error(`OpenAI 请求失败 (${response.status})：${message}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("模型没有返回可解析的内容。");
  }

  return parseResponseText(text);
};
