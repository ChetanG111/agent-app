// Wikipedia Search Tool
// Uses the Wikipedia API (free, no key required)

export interface WikipediaSearchResult {
    title: string;
    pageid: number;
    snippet: string;
    url: string;
}

export interface WikipediaSummary {
    title: string;
    extract: string;
    url: string;
    thumbnail?: string;
}

/**
 * Search Wikipedia for articles matching a query
 */
export async function searchWikipedia(query: string, limit: number = 5): Promise<WikipediaSearchResult[]> {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodedQuery}&srlimit=${limit}&format=json&origin=*`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Wikipedia API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.query?.search) {
            return [];
        }

        return data.query.search.map((result: { title: string; pageid: number; snippet: string }) => ({
            title: result.title,
            pageid: result.pageid,
            snippet: result.snippet.replace(/<[^>]*>/g, ''), // Remove HTML tags
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, '_'))}`,
        }));
    } catch (error) {
        console.error('[Wikipedia] Search failed:', error);
        return [];
    }
}

/**
 * Get the summary/extract of a specific Wikipedia article
 */
export async function getWikipediaSummary(title: string): Promise<WikipediaSummary | null> {
    try {
        const encodedTitle = encodeURIComponent(title);
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`;

        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Wikipedia API error: ${response.status}`);
        }

        const data = await response.json();

        return {
            title: data.title,
            extract: data.extract,
            url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedTitle}`,
            thumbnail: data.thumbnail?.source,
        };
    } catch (error) {
        console.error('[Wikipedia] Summary fetch failed:', error);
        return null;
    }
}

/**
 * Search and get summaries for top results
 */
export async function searchAndSummarize(query: string): Promise<{
    results: WikipediaSearchResult[];
    summaries: WikipediaSummary[];
}> {
    const results = await searchWikipedia(query, 3);

    const summaries: WikipediaSummary[] = [];
    for (const result of results) {
        const summary = await getWikipediaSummary(result.title);
        if (summary) {
            summaries.push(summary);
        }
    }

    return { results, summaries };
}

/**
 * Format Wikipedia results for agent consumption
 */
export function formatWikipediaResults(data: Awaited<ReturnType<typeof searchAndSummarize>>): string {
    if (data.summaries.length === 0) {
        return 'No Wikipedia articles found.';
    }

    const parts: string[] = ['**Wikipedia Results:**\n'];

    data.summaries.forEach((summary, i) => {
        parts.push(`### ${i + 1}. ${summary.title}`);
        parts.push(summary.extract);
        parts.push(`🔗 ${summary.url}\n`);
    });

    return parts.join('\n');
}
