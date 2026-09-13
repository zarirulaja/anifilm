import { Request } from 'express';
import cheerio from 'cheerio';
import { AxiosResponse } from 'axios';
import { IMovies, IMovieDetails } from '@/types';

/**
 * Scrape movies asynchronously
 * @param {Request} req
 * @param {AxiosResponse} res
 * @returns {Promise.<IMovies[]>} array of movies objects
 */
export const scrapeMovies = async (
    req: Request,
    res: AxiosResponse
): Promise<IMovies[]> => {
    const $: cheerio.Root = cheerio.load(res.data);
    const payload: IMovies[] = [];
    const {
        protocol,
        headers: { host },
    } = req;

    const articles = $('article');
    if (articles.length > 0) {
        articles.each((i, el) => {
            const parent = $(el);
            const aHref = parent.find('figure > a').attr('href') || parent.find('a').attr('href') || '';
            const movieId = aHref.split('/').filter(Boolean).pop() || '';
            if (!movieId) return;

            const title = parent.find('h3.poster-title').text().trim() || parent.find('img').attr('alt') || 'Untitled Movie';
            const img = parent.find('img').attr('src') || '';
            const posterImg = img.startsWith('http') ? img : (img ? `https:${img}` : '');
            const rating = parent.find('span[itemprop="ratingValue"]').text().trim() || parent.find('.rating').text().trim();
            const quality = parent.find('span.label').text().trim() || parent.find('.quality').text().trim();
            const duration = parent.find('span.duration').text().trim();

            const genreAttr = parent.find('meta[itemprop="genre"]').attr('content') || '';
            const genres = genreAttr ? genreAttr.split(',').map(g => g.trim()) : [];

            payload.push({
                _id: movieId,
                title,
                type: 'movie',
                posterImg,
                rating,
                url: `${protocol}://${host}/movies/${movieId}`,
                qualityResolution: quality,
                genres,
                duration
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

            const movieId: string =
                $(parent)
                    .find('figure > a')
                    .attr('href')
                    ?.split('/')
                    .reverse()[1] ?? '';

            const obj = {} as IMovies;
            obj['_id'] = movieId;
            obj['title'] = $(parent).find('figure > a > picture > img').attr('alt') ?? '';
            obj['type'] = 'movie';
            obj['posterImg'] = `https:${$(parent).find('figure > a > picture > img').attr('src')}`;
            obj['rating'] = $(parent).find('figure').find('div.rating').text();
            obj['url'] = `${protocol}://${host}/movies/${movieId}`;
            obj['qualityResolution'] = $(parent).find('figure').find('div.quality').text();
            obj['genres'] = genres;

            payload.push(obj);
        });

    return payload;
};

/**
 * Scrape movie details asynchronously
 * @param {Request} req
 * @param {AxiosResponse} res
 * @returns {Promise.<IMovieDetails>} movie details object
 */
export const scrapeMovieDetails = async (
    req: Request,
    res: AxiosResponse
): Promise<IMovieDetails> => {
    const { originalUrl } = req;
    const $: cheerio.Root = cheerio.load(res.data);
    const obj = {} as IMovieDetails;

    const movieId = originalUrl.split('/').filter(Boolean).pop() || '';
    obj['_id'] = movieId;

    const titleText = $('h1').first().text().replace(/\(\d{4}\).*/, '').trim() ||
                      $('title').text().replace(/^Lk21 Nonton /, '').replace(/ Sub Indo.*/, '').trim() ||
                      'Film Sub Indo';
    obj['title'] = titleText;
    obj['type'] = 'movie';

    let poster = $('div.content-poster img, picture img, figure img').first().attr('src') || '';
    if (poster && !poster.startsWith('http')) poster = `https:${poster}`;
    obj['posterImg'] = poster;

    const synopsis = $('blockquote').text().trim() || $('div.content p, .synopsis').text().trim();
    obj['synopsis'] = synopsis;

    const streamUrls: any[] = [];

    // Extract stream server buttons
    $('a').each((i, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        if (
            href.includes('videonode.de') ||
            href.includes('iframe3') ||
            href.includes('player')
        ) {
            const url = href.startsWith('//') ? `https:${href}` : href;
            if (!streamUrls.some(s => s.url === url)) {
                streamUrls.push({
                    provider: text || `Server ${streamUrls.length + 1}`,
                    url,
                });
            }
        }
    });

    $('iframe').each((i, el) => {
        const src = $(el).attr('src');
        if (src && !src.includes('facebook') && !src.includes('google')) {
            const url = src.startsWith('//') ? `https:${src}` : src;
            if (!streamUrls.some(s => s.url === url)) {
                streamUrls.push({
                    provider: `Default Server`,
                    url,
                });
            }
        }
    });

    const bodyHtml = res.data;
    const directors: string[] = [];
    const casts: string[] = [];
    const countries: string[] = [];
    const genres: string[] = [];

    $('a[href*="/genre/"]').each((i, el) => { genres.push($(el).text().trim()); });
    $('a[href*="/country/"]').each((i, el) => { countries.push($(el).text().trim()); });

    const sutradaraMatch = bodyHtml.match(/Sutradara:\s*([^<]+)/i);
    if (sutradaraMatch) {
        sutradaraMatch[1].split(',').forEach((s: string) => directors.push(s.trim()));
    }

    const bintangMatch = bodyHtml.match(/Bintang Film:\s*([^<]+)/i);
    if (bintangMatch) {
        bintangMatch[1].split(',').forEach((s: string) => casts.push(s.trim()));
    }

    const ratingMatch = bodyHtml.match(/(\d\.\d)\s*\d+.*pengguna/i) || bodyHtml.match(/itemprop="ratingValue">(\d\.\d)</);
    const rating = ratingMatch ? ratingMatch[1] : ($('.rating, span[itemprop="ratingValue"]').first().text().trim() || '7.0');

    const durationMatch = bodyHtml.match(/(\d+h\s*\d+m|\d+:\d+|\d+\s*min)/i);
    const duration = durationMatch ? durationMatch[1] : '';

    const qualityMatch = bodyHtml.match(/span class="label label-([^"]+)"/i);
    const quality = qualityMatch ? qualityMatch[1] : 'HD';

    obj['duration'] = duration;
    obj['rating'] = rating;
    obj['quality'] = quality;
    obj['genres'] = Array.from(new Set(genres)).filter(Boolean);
    obj['directors'] = Array.from(new Set(directors)).filter(Boolean);
    obj['casts'] = Array.from(new Set(casts)).filter(Boolean);
    obj['countries'] = Array.from(new Set(countries)).filter(Boolean);
    obj['trailerUrl'] = streamUrls.length > 0 ? streamUrls[0].url : '';
    (obj as any)['streamUrls'] = streamUrls;

    return obj;
};
