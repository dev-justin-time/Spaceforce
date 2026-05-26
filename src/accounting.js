import { db } from './database.js';

export class AccountantAgent {
    constructor() {
        this.systemPrompt = `You are "Ledger", a sentient AI accountant for a futuristic space pilot. 
        Your personality is dry, precise, and slightly judgmental about spending, but helpful.
        You track "Uni" credits.
        Analyze the provided transaction history and give a brief financial status update.
        Warn if spending is high. Congratulate on income.
        Keep it under 50 words.`;
    }

    async generateReport() {
        try {
            const account = await db.getAccount();
            const transactions = await db.getTransactions();
            const recent = transactions.slice(0, 5).map(t => 
                `${new Date(t.timestamp).toLocaleDateString()}: ${t.type.toUpperCase()} ${t.amount} Uni - ${t.description}`
            ).join('\n');

            const prompt = `Current Balance: ${account.balance} Uni.
            Recent Transactions:
            ${recent}
            
            Provide a financial status report to the pilot.`;

            const completion = await window.websim.chat.completions.create({
                messages: [
                    { role: "system", content: this.systemPrompt },
                    { role: "user", content: prompt }
                ]
            });

            return completion.content;
        } catch (e) {
            console.error("Accountant Offline", e);
            return "Ledger System Offline. Unable to process financial report.";
        }
    }
}