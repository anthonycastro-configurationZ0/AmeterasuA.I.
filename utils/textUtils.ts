/**
 * A collection of utility functions for text manipulation.
 */

/**
 * Strips markdown formatting from a string.
 * This is useful for preparing text for text-to-speech engines
 * that should not read out markdown characters like '*' or '#'.
 * @param text The input string with potential markdown.
 * @returns The cleaned string without markdown formatting.
 */
export const stripMarkdown = (text: string): string => {
    if (!text) return '';
    
    return text
        // Remove headers (e.g., #, ##, ###)
        .replace(/^#+\s+/gm, '')
        // Remove bold/italic (e.g., **, *, __, _)
        .replace(/(\*\*|__|\*|_)/g, '')
        // Remove strikethrough (e.g., ~~)
        .replace(/~~/g, '')
        // Remove inline code (e.g., `code`)
        .replace(/`/g, '')
        // Remove blockquotes (e.g., > )
        .replace(/^>\s+/gm, '')
        // Remove links but keep the link text (e.g., [text](url) -> text)
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        // Remove images (e.g., ![alt](url))
        .replace(/!\[[^\]]*\]\([^\)]+\)/g, '')
        // Remove horizontal rules (e.g., ---, ***, ___)
        .replace(/^(---|\*\*\*|___)\s*$/gm, '')
        // Remove list markers (e.g., *, -, 1.)
        .replace(/^(\*|-|\d+\.)\s+/gm, '')
        .trim();
};
