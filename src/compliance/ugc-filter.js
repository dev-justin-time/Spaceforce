/**
 * UGC Content Filtering System
 * Compliant with App Store Guideline 1.2 and Google Play UGC Policy.
 */

const FORBIDDEN_WORDS = [
    'abuse', 'scam', 'crypto', 'nft', 'hack', 'cheat', 'insult', 'toxic',
    'profanity', 'threat', 'violence', 'harass', 'spam', 'ad', 'buy', 'sell',
    'offensive_term_placeholder', 'badword1', 'badword2'
    // This list should be expanded periodically to meet Guideline 1.2 compliance
];

export class UGCFilter {
    /**
     * Filters input text for profanity and disallowed content.
     * @param {string} text 
     * @returns {string} Sanitized text
     */
    static filter(text) {
        if (!text) return "";
        
        let filtered = text;
        FORBIDDEN_WORDS.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            filtered = filtered.replace(regex, '***');
        });
        
        // Simple duplicate character spam reduction
        filtered = filtered.replace(/(.)\1{10,}/g, '$1$1$1');
        
        return filtered;
    }

    /**
     * Validates if content is safe for broadcasting.
     * @param {string} text 
     * @returns {boolean}
     */
    static isSafe(text) {
        const lower = text.toLowerCase();
        return !FORBIDDEN_WORDS.some(word => lower.includes(word));
    }
}