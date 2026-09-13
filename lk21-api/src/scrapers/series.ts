import cheerio from 'cheerio';
import { AxiosResponse } from 'axios';
import { Request } from 'express';
import { ISeasonsList, ISeries, ISeriesDetails } from '@/types';

/**
 * Scrape series asynchronously
 * @param {Request} req
 * @param {AxiosResponse} res
 * @returns {Promise.<ISeries[]>} array of series objects
 */
export const scrapeSeries = async (
    req: Request,
    res: AxiosResponse
): Promise<ISeries[]> => {
    const $: cheerio.Root = cheerio.load(res.data);
    const payload: ISeries[] = [];
    const {
        headers: { host },
        protocol,
    } = req;

    const articles = $('article');
    if (articles.length > 0) {
        articles.each((i, el) => {
            const parent = $(el);
            const aHref = parent.find('figure > a').attr('href') || parent.find('a').attr('href') || '';
            const seriesId = aHref.split('/').filter(Boolean).pop() || '';
            if (!seriesId) return;

            const title = parent.find('h3.poster-title').text().trim() || parent.find('img').attr('alt') || 'Untitled Series';
            const img = parent.find('img').attr('src') || '';
            const posterImg = img.startsWith('http') ? img : (img ? `https:${img}` : '');
            const rating = parent.find('span[itemprop="ratingValue"]').text().trim() || parent.find('.rating').text().trim();

            const genreAttr = parent.find('meta[itemprop="genre"]').attr('content') || '';
            const genres = genreAttr ? genreAttr.split(',').map(g => g.trim()) : [];

            payload.push({
                _id: seriesId,
                title,
                type: 'series',
                posterImg,
                rating,
                url: `${protocol}://${host}/series/${seriesId}`,
                genres,
            } as any);
        });
        return payload;
    }

    $('main > div.container > section.archive')
        .find('div.grid-archive > div#grid-wrapper > div.infscroll-item')
        .each((i, el) => {
            const parent: cheerio.Cheerio = $(el).find('article.mega-item');
            const genres: string[] = [];

            $(parent)
                .find('footer')
                .find('div.grid-categories > a')
                .each((i, el2) => {
                    const x: string[] = $(el2).attr('href')?.split('/') ?? [];
                    if (x.length > 0 && x[1] === 'genre') {
                        genres.push(x[2]);
                    }
                });

            const seriesId: string =
                $(parent)
                    .find('figure > a')
                    .attr('href')
                    ?.split('/')
                    .reverse()[1] ?? '';

            const obj = {} as ISeries;
            obj['_id'] = seriesId;
            obj['title'] = $(parent).find('figure > a > picture > img').attr('alt') ?? '';
            obj['type'] = 'series';
            obj['posterImg'] = `https:${$(parent).find('figure > a > picture > img').attr('src')}`;
            obj['rating'] = $(parent).find('figure').find('div.rating').text();
            obj['url'] = `${protocol}://${host}/series/${seriesId}`;
            obj['genres'] = genres;

            payload.push(obj);
        });

    return payload;
};

/**
 * Scrape series details asynchronously
 * @param {Request} req
 * @param {AxiosResponse} res
 * @returns {Promise.<ISeriesDetails>} series details object
 */
export const scrapeSeriesDetails = async (
    req: Request,
    res: AxiosResponse
): Promise<ISeriesDetails> => {
    const { originalUrl } = req;
    const $: cheerio.Root = cheerio.load(res.data);
    const obj = {} as ISeriesDetails;

    const seriesId = originalUrl.split('/').filter(Boolean).pop() || '';
    obj['_id'] = seriesId;

    const titleText = $('h1').first().text().replace(/\(\d{4}\).*/, '').trim() ||
                      $('title').text().replace(/^Nonton /, '').replace(/ Sub Indo.*/, '').trim() ||
                      'Series Sub Indo';
    obj['title'] = titleText;
    obj['type'] = 'series';

    let poster = $('div.content-poster img, picture img, figure img').first().attr('src') || '';
    if (poster && !poster.startsWith('http')) poster = `https:${poster}`;
    obj['posterImg'] = poster;

    const synopsis = $('blockquote').text().trim() || $('div.content p, .synopsis').text().trim();
    obj['synopsis'] = synopsis;

    const streamUrls: any[] = [];
    $('iframe').each((i, el) => {
        const src = $(el).attr('src');
        if (src && !src.includes('facebook') && !src.includes('google')) {
            streamUrls.push({
                provider: `Server ${i + 1}`,
                url: src.startsWith('//') ? `https:${src}` : src,
            });
        }
    });

    const bodyHtml = res.data;
    const directors: string[] = [];
    const casts: string[] = [];
    const countries: string[] = [];
    const genres: string[] = [];

    $('a[href*="/genre/"]').each((i, el) => { genres.push($(el).text().trim()); });
    $('a[href*="/country/"]').each((i, el) => { countries.push($(el).text().trim()); });

    const ratingMatch = bodyHtml.match(/(\d\.\d)\s*\d+.*pengguna/i) || bodyHtml.match(/itemprop="ratingValue">(\d\.\d)</);
    const rating = ratingMatch ? ratingMatch[1] : ($('.rating, span[itemprop="ratingValue"]').first().text().trim() || '7.0');

    obj['rating'] = rating;
    obj['genres'] = Array.from(new Set(genres)).filter(Boolean);
    obj['directors'] = Array.from(new Set(directors)).filter(Boolean);
    obj['casts'] = Array.from(new Set(casts)).filter(Boolean);
    obj['countries'] = Array.from(new Set(countries)).filter(Boolean);
    (obj as any)['streamUrls'] = streamUrls;

    return obj;
};
