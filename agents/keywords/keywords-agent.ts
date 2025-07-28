// @ts-expect-error: stopword package has no TypeScript types available
import * as sw from "stopword";
import { AzureChatOpenAI } from "@langchain/openai";
import nlp from "compromise";

// NER-based organization extraction using compromise
export function extractOrganizationsFromQuery(query: string): string[] {
  const doc = nlp(query);
  let orgs: string[] = [];
  if (doc.organizations) {
    orgs = doc.organizations().out('array');
  }
  // Fallback: match capitalized words (very naive)
  if (orgs.length === 0) {
    orgs = doc.match('#Noun').if('#TitleCase').out('array');
  }
  // Remove stopwords and duplicates
  const cleanedOrgs = orgs.map(o => o.trim()).filter(Boolean);
  return Array.from(new Set(sw.removeStopwords(cleanedOrgs)));
}

// LLM-based keyword extraction (unchanged)
async function llmExtractKeywords(query: string): Promise<string[] | null> {
  try {
    const chat = new AzureChatOpenAI({
      model: "gpt-4o",
      temperature: 0,
      maxRetries: 2,
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY!,
      azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME!,
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME_1!,
      azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION_1!,
    });
    const prompt = `Extract only the unique, high-signal keywords from the following user query. Focus on company names, product names, people, or unique identifiers. Do NOT include generic words like 'account', 'email', 'message', 'update', etc. Only output a comma-separated list of keywords, no explanations.\n\nQuery: "${query}"\nKeywords:`;
    const response = await chat.invoke([
      { role: "system", content: "You are a helpful assistant that extracts only unique, high-signal keywords (company names, product names, people, unique identifiers) from user queries. Never include generic words like 'account', 'email', etc." },
      { role: "user", content: prompt },
    ]);
    const text = (response.content as string).trim();
    // Split by comma, clean up, and filter out stopwords
    const keywords = text
      .split(",")
      .map(k => k.trim())
      .filter(Boolean);
    return sw.removeStopwords(keywords);
  } catch (err) {
    console.error("LLM keyword extraction failed:", err);
    return null;
  }
}

// Fallback: simple regex/stopword removal using stopword package
function fallbackExtractKeywords(query: string): string[] {
  const cleaned = query.toLowerCase().replace(/[?.,!]/g, "");
  const words = cleaned.split(/\s+/).filter(Boolean);
  const filteredWords = sw.removeStopwords(words);
  return Array.from(new Set(filteredWords));
}

// Main exported function: returns only keywords (for legacy use)
export async function extractKeywordsFromQuery(query: string): Promise<string[]> {
  // Try LLM first
  const llmKeywords = await llmExtractKeywords(query);
  if (llmKeywords && llmKeywords.length > 0) {
    return llmKeywords;
  }
  // Fallback
  return fallbackExtractKeywords(query);
}

// New exported function: returns both organizations and keywords
export async function extractEntitiesFromQuery(query: string): Promise<{ organizations: string[], keywords: string[] }> {
  const organizations = extractOrganizationsFromQuery(query);
  const keywords = await extractKeywordsFromQuery(query);
  return { organizations, keywords };
} 