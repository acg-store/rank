const cheerio = require('cheerio');
const request = require('superagent');
const fs = require('fs');

const RANK_MOVIE_LINK = "https://movie.douban.com/j/search_subjects?type=movie&tag=%E7%83%AD%E9%97%A8&sort=recommend&page_limit=20&page_start=0";
const RANK_TV_LINK = "https://movie.douban.com/j/search_subjects?type=tv&tag=%E7%83%AD%E9%97%A8&sort=recommend&page_limit=20&page_start=0";
const RANK_NOVEL_LINK = "https://www.qidian.com/rank/readIndex/";
const RANK_COMIC_LINK = "https://www.dm5.com/manhua-rank/?t=4";
const RANK_AUDIOBOOK_LINK = "https://www.ximalaya.com/top/paid/youshengshu/";
const RANK_ANIME_LINK = "https://www.uiviki.com/anime-rimanweekhits.html";

async function requestMovie() {
    console.log('start get movie rank');
    try {
        return await request.get(RANK_MOVIE_LINK).then((res) => {
            console.log('parse movie rank');
            let movies = res.body.subjects;
            let rankItemList = [];
            movies.forEach(movie => {
                rankItemList.push({ title: movie.title, cover: movie.cover, url: movie.url, rate: movie.rate });
            });
            return rankItemList;
        });
    } catch (e) {
        return [];
    }
}

async function requestTV() {
    console.log('start get tv rank');
    try {
        return await request.get(RANK_TV_LINK).then((res) => {
            console.log('parse tv rank');
            let movies = res.body.subjects;
            let rankItemList = [];
            movies.forEach(movie => {
                rankItemList.push({ title: movie.title, cover: movie.cover, url: movie.url, rate: movie.rate });
            });
            return rankItemList;
        });
    } catch (e) {
        return [];
    }
}

async function requestAudiobook() {
    console.log('start get audiobook rank');
    try {
        return await request.get(RANK_AUDIOBOOK_LINK).then((res) => {
            console.log('parse audiobook rank');
            let $ = cheerio.load(res.text);
            let rankItemList = [];
            $('.album-item._Sq').each(function (i, e) {
                let self = $(this);
                rankItemList.push({
                    title: self.find('.title').text(),
                    cover: `https:${self.find('.album-cover > img').attr('src')}`,
                    info: self.find('.description').text(),
                    author: self.find('.user-name.mgl-20_title').text(),
                    newest: self.find('.update').text(),
                });
            });
            return rankItemList;
        });
    } catch (e) {
        return [];
    }
}

async function requestNovel() {
    console.log('start get novel rank');
    try {
        return await request.get(RANK_NOVEL_LINK).then((res) => {
            console.log('parse novel rank');
            let $ = cheerio.load(res.text);
            let rankItemList = [];
            $('#book-img-text').find('li').each(function (i, e) {
                let self = $(this);
                rankItemList.push({
                    title: self.find('h2').text(),
                    cover: `https:${self.find('img').first().attr('src')}`,
                    info: self.find('.intro').text(),
                    author: self.find('.author > a').first().text(),
                    newest: self.find('.update > a').text().replace('最新更新 ', ''),
                    updateTime: self.find('.update > span').text(),
                });
            });
            return rankItemList;
        });
    } catch (e) {
        return [];
    }
}

async function requestAnime() {
    console.log('start get anime rank')
    try {
        return await request.get(RANK_ANIME_LINK).then((res) => {
            console.log('parse anime rank');
            let $ = cheerio.load(res.text);
            let rankItemList = [];
            $('.vodlist').children('li').each(function (i, e) {
                let self = $(this);
                rankItemList.push({
                    title: self.children('a').attr('title'),
                    cover: self.find('img').attr('data-echo'),
                    info: self.find('.info').map((i, e) => $(e).text().trim()).get().join('\n'),
                    popular: self.find('span.pic-text').text(),
                });
            });
            return rankItemList;
        });
    } catch (e) {
        return [];
    }
}

async function requestComic() {
    console.log('start get comic rank')
    try {
        return await request.get(RANK_COMIC_LINK).then((res) => {
            console.log('parse comic rank');
            let $ = cheerio.load(res.text);
            let rankItemList = [];
            $('.mh-list.col3.top-cat').children('li').each(function (i, e) {
                let self = $(this);
                rankItemList.push({
                    title: self.find('h2.title').first().text(),
                    cover: self.find('.mh-cover').attr('style').match(/url\((.*?)\)/)[1],
                    info: self.find('.desc').first().text().trim(),
                    author: self.find('p.zl').first().find('a').map(function (i, e) { return $(e).text() }).get().join(',').trim(),
                    newest: self.find('.chapter > a').first().text(),
                });
            });
            return rankItemList;
        });
    } catch (e) {
        return [];
    }

}

(async () => {
    const movie = await requestMovie();
    const tv = await requestTV();
    const novel = await requestNovel();
    const audiobook = await requestAudiobook();
    const anime = await requestAnime();
    const comic = await requestComic();
    const rank = {
        movie: movie,
        tv: tv,
        novel: novel,
        audiobook: audiobook,
        anime: anime,
        comic: comic,
    }
    console.log('write rank.json')
    fs.writeFile('./rank.json', JSON.stringify(rank), (err) => {
        if (err) throw err;
        console.log("get rank success");
    });
})();