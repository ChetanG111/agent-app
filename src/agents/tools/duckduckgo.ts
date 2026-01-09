// DuckDuckGo Search Tool
// Uses the DuckDuckGo Instant Answer API (free, no key required)

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    source: 'duckduckgo';
}

export interface DuckDuckGoResponse {
    Abstract: string;
    AbstractText: string;
    AbstractSource: string;
    AbstractURL: string;
    Image: string;
    Heading: string;
    RelatedTopics: Array<{
        Text?: string;
        FirstURL?: string;
        Icon?: { URL: string };
        Topics?: Array<{ Text: string; FirstURL: string }>;
    }>;
    Results: Array<{
        Text: string;
        FirstURL: string;
    }>;
    Answer: string;
    AnswerType: string;
}

/**
 * Search DuckDuckGo Instant Answers API
 * Note: This API is for instant answers, not full web search results
 */
export async function searchDuckDuckGo(query: string): Promise<{
    answer?: string;
    abstract?: string;
    abstractSource?: string;
    abstractUrl?: string;
    results: SearchResult[];
    relatedTopics: string[];
}> {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`DuckDuckGo API error: ${response.status}`);
        }

        const data: DuckDuckGoResponse = await response.json();

        // Extract results from related topics
        const results: SearchResult[] = [];
        const relatedTopics: string[] = [];

        // Add direct results
        if (data.Results) {
            data.Results.forEach(r => {
                results.push({
                    title: r.Text.split(' - ')[0] || r.Text,
                    url: r.FirstURL,
                    snippet: r.Text,
                    source: 'duckduckgo',
                });
            });
        }

        // Add related topics as results
        if (data.RelatedTopics) {
            data.RelatedTopics.forEach(topic => {
                if (topic.Text && topic.FirstURL) {
                    results.push({
                        title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 50),
                        url: topic.FirstURL,
                        snippet: topic.Text,
                        source: 'duckduckgo',
                    });
                    relatedTopics.push(topic.Text);
                }
                // Handle nested topics
                if (topic.Topics) {
                    topic.Topics.forEach(t => {
                        if (t.Text && t.FirstURL) {
                            results.push({
                                title: t.Text.split(' - ')[0] || t.Text.substring(0, 50),
                                url: t.FirstURL,
                                snippet: t.Text,
                                source: 'duckduckgo',
                            });
                        }
                    });
                }
            });
        }

        return {
            answer: data.Answer || undefined,
            abstract: data.AbstractText || undefined,
            abstractSource: data.AbstractSource || undefined,
            abstractUrl: data.AbstractURL || undefined,
            results: results.slice(0, 10), // Limit to 10 results
            relatedTopics: relatedTopics.slice(0, 5),
        };
    } catch (error) {
        console.error('[DuckDuckGo] Search failed:', error);
        return {
            results: [],
            relatedTopics: [],
        };
    }
}

/**
 * Format DuckDuckGo results for agent consumption
 */
export function formatDuckDuckGoResults(results: Awaited<ReturnType<typeof searchDuckDuckGo>>): string {
    const parts: string[] = [];

    if (results.answer) {
        parts.push(`**Direct Answer:** ${results.answer}`);
    }

    if (results.abstract) {
        parts.push(`**Summary (${results.abstractSource}):** ${results.abstract}`);
        if (results.abstractUrl) {
            parts.push(`Source: ${results.abstractUrl}`);
        }
    }

    if (results.results.length > 0) {
        parts.push('\n**Related Results:**');
        results.results.slice(0, 5).forEach((r, i) => {
            parts.push(`${i + 1}. ${r.snippet}`);
            parts.push(`   URL: ${r.url}`);
        });
    }

    if (parts.length === 0) {
        return 'No results found from DuckDuckGo.';
    }

    return parts.join('\n');
}
