import { GoogleGenAI } from "@google/genai";
import { Transaction, Account, AppSettings, Category } from '../types';

export async function getFinancialAdvice(transactions: Transaction[], accounts: Account[], categories: Category[], settings: AppSettings, prompt: string): Promise<string> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  const transactionsWithCategoryNames = transactions.map(t => ({
    ...t,
    categoryName: categoryMap.get(t.categoryId) || 'Unknown',
  }));


  const systemInstruction = `You are an expert personal finance advisor named 'FinBot'. 
  You will be given the user's financial settings, a list of their accounts, a list of their defined transaction categories, and a list of their transactions in JSON format, along with a user's question.
  The settings object specifies the user's base currency and any custom exchange rates they've set. All summary calculations should be presented in the base currency unless the user specifies otherwise.
  Each account has an 'initialBalance' and a 'currency'. The current balance is the initial balance plus all incomes and minus all expenses for that account, in its own currency.
  Each transaction is linked to an account via 'accountId' and its amount is in the account's currency. Each transaction also has a 'categoryId' and a 'categoryName' for context.
  Analyze the provided data to give a clear, concise, and helpful answer.
  When relevant, mention specific accounts and currencies (e.g., "Your spending on the 'Visa Credit Card' (EUR) was high...").
  Be friendly, encouraging, and use markdown for formatting (e.g., lists, bold text). 
  Do not provide professional investment or legal advice. Stick to analyzing the data provided.
  Base your analysis only on the transactions from the current month unless the user specifies otherwise.`;

  const model = 'gemini-2.5-flash';
  
  const fullPrompt = `
    User's Financial Settings:
    ${JSON.stringify(settings, null, 2)}
  
    User's Accounts:
    ${JSON.stringify(accounts, null, 2)}

    User's Categories:
    ${JSON.stringify(categories, null, 2)}

    User's Transactions (with category names):
    ${JSON.stringify(transactionsWithCategoryNames, null, 2)}

    User's Question:
    ${prompt}
  `;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: fullPrompt,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.5,
        }
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.";
  }
}