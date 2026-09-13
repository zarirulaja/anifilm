import cheerio from 'cheerio';
import { AxiosResponse } from 'axios';
import { Request } from 'express';
import { ISearchedMoviesOrSeries } from '@/types';

/**
 * Scrape searched movies or series
 * @param {Request} req
 * @param {AxiosResponse} res
 * @returns {Promise.<ISearchedMoviesOrSeries[]>} array of movies or series
 */
export const scrapeSearchedMoviesOrSeries = async (
    req: Request,
    res: AxiosResponse
): Promise<ISearchedMoviesOrSeries[]> => {
    const $: cheerio.Root = cheerio.load(res.data);
    const payload: ISearchedMoviesOrSeries[] = [];
    const {
        headers: { host },
        protocol,
    } = req;

    const articles = $('article');
    if (articles.length > 0) {
        articles.each((i, el) => {
            const parent = $(el);
            const aHref = parent.find('figure > a').attr('href') || parent.find('a').attr('href') || '';
            const movieId = aHref.split('/').filter(Boolean).pop() || '';
            if (!movieId) return;

            const isSeries = aHref.includes('series') || parent.find('a').attr('title')?.includes('series');
            const type = isSeries ? 'series' : 'movie';

            const title = parent.find('h3.poster-title').text().trim() || parent.find('img').attr('alt') || 'Untitled';
            const img = parent.find('img').attr('src') || '';
            const posterImg = img.startsWith('http') ? img : (img ? `https:${img}` : '');

            const genreAttr = parent.find('meta[itemprop="genre"]').attr('content') || '';
            const genres = genreAttr ? genreAttr.split(',').map(g => g.trim()) : [];

            payload.push({
                _id: movieId,
                title,
                type,
                posterImg,
                url: `${protocol}://${host}/${type}/${movieId}`,
                genres,
            } as any);
        });
        return payload;
    }

    $('div.search-wrapper > div.search-item').each((i, el) => {
        const content: cheerio.Cheerio = $(el).find('div.search-content');
        const obj = {} as ISearchedMoviesOrSeries;
        const genres: string[] = [];

        let type: 'movie' | 'series' = 'movie';

        $(el)
            .find('p.cat-links > a')
            .each((i, el2) => {
                const x: string[] = $(el2).attr('href')?.split('/') || [];
                if (x[1] === 'genre') genres.push(x[2]);
                if (x[1] === 'series') type = 'series';
            });

        const movieId =
            $(content).find('h2 > a').attr('href')?.split('/').reverse()[1] ||
            '';

        obj['_id'] = movieId;
        obj['title'] = $(content).find('h2 > a').text();
        obj['type'] = type;
        obj['posterImg'] = `https://${$(el).find('figure > a > img').attr('src')}`;
        obj['url'] = `${protocol}://${host}/${type}/${movieId}`;
        obj['genres'] = genres;

        payload.push(obj);
    });

    return payload;
};
