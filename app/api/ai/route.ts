import { NextRequest, NextResponse } from "next/server";

type Provider = "openai" | "anthropic" | "gemini" | "deepseek";

const config: Record<Provider, { key: string; url: string }> = {
  openai: { key: "OPENAI_API_KEY", url: "https://api.openai.com/v1/responses" },
  anthropic: { key: "ANTHROPIC_API_KEY", url: "https://api.anthropic.com/v1/messages" },
  gemini: { key: "GEMINI_API_KEY", url: "https://generativelanguage.googleapis.com/v1beta/models" },
  deepseek: { key: "DEEPSEEK_API_KEY", url: "https://api.deepseek.com/chat/completions" },
};

export async function POST(request: NextRequest) {
  const { provider = "openai", model, prompt, system } = await request.json() as { provider?: Provider; model?: string; prompt?: string; system?: string };
  if (!config[provider] || !model || !prompt) return NextResponse.json({ error: "缺少有效的 provider、model 或 prompt" }, { status: 400 });
  const apiKey = process.env[config[provider].key];
  if (!apiKey) return NextResponse.json({ error: `${config[provider].key} 尚未在云端配置` }, { status: 503 });

  let url = config[provider].url;
  let headers: Record<string, string> = { "content-type": "application/json" };
  let body: unknown;
  if (provider === "openai") {
    headers.authorization = `Bearer ${apiKey}`; body = { model, instructions: system, input: prompt };
  } else if (provider === "anthropic") {
    headers["x-api-key"] = apiKey; headers["anthropic-version"] = "2023-06-01"; body = { model, max_tokens: 2048, system, messages: [{ role: "user", content: prompt }] };
  } else if (provider === "gemini") {
    url = `${url}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`; body = { system_instruction: system ? { parts: [{ text: system }] } : undefined, contents: [{ parts: [{ text: prompt }] }] };
  } else {
    headers.authorization = `Bearer ${apiKey}`; body = { model, messages: [{ role: "system", content: system || "你是一名自媒体经营顾问。" }, { role: "user", content: prompt }] };
  }
  const upstream = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
