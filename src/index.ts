// import Puppeteer in Typescript
import { launch } from 'puppeteer';

interface IData {
    url?: string;
    username: string,
    status_type: string,
    thumbnail?: string,
    videos?: Array<Object>,
    images?: Array<string>,
    gif?: Array<string>,
}

const URL = "https://en.savefrom.net/70/download-from-twitter";
let success = false;
let message = '';


const input = '#sf_url';
const button = '#sf_submit';
const result = '#sf_result';
const resultDiv = '#sf_result > div';
const infoBox = '#sf_result > div > div > div.info-box';

const twitter = async (url: string) => {
    if (url.length !== 0) {
        if (url.includes('twitter')) {
            const username = url.split('/')[3];
            return download(url, username);
        }
        else return { success: 'false', message: 'Not a twitter url', data: {} }
    } else return { success: false, message: 'Url is empty', data: {} };


}

const download = async (url: string, username: string) => {
    try {
        let data: IData = { url: url, username: username, status_type: '' };
        const browser = await launch({ headless: false });
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 5000 });
        await page.goto(URL, { timeout: 10000, waitUntil: 'domcontentloaded' });
        await page.setJavaScriptEnabled(true);
        await page.waitForSelector(input);
        const r = await page.$(input) as any;
        await r.type(url);
        await page.click(button);
        await page.waitForSelector(result);
        await page.waitForSelector(resultDiv);
        const totalImages = await page.evaluate(() => {
            let parent = document.querySelector('#sf_result > div') as HTMLElement;
            if (Object.entries(parent.children[0]).length === 0) {
                return (parent.childElementCount);
            }
            else return 1;
        });
        //Error Response
        try {
            let response: string;
            for (let index = 1; index <= totalImages; index++) {
                let element = `#sf_result > div > div.result-box.simple.center.result-failure`;
                await page.waitForSelector(element, { timeout: 2000 });
                const messageError = await page.$$eval(`${element}`, texts => texts.map((text: HTMLDivElement) => text.textContent));
                response = messageError.toString();
            }
            browser.close();
            return { success: false, message: response, data: {} };
        } catch (error) { }

        let images = [];
        try {
            for (let index = 1; index <= totalImages; index++) {
                let element = `#sf_result > div.media-result > div:nth-child(${index}) > div.thumb-box.thumb-272 > a > img`;
                await page.waitForSelector(element, { timeout: 3000 });
                const imageElement = await page.$$eval(`${element}`, images => images.map((image: HTMLImageElement) => image.src));
                const image = imageElement.toString();
                images.push(image);
            }
            if (images.length > 0) {
                success = true;
                images.forEach(element => {
                    if (element.includes('amplify_video_thumb')) data.status_type = 'video';
                    else if (element.includes('tweet_video_thumb')) data.status_type = 'gif';
                    else {
                        data.status_type = 'image';
                        data.images = images
                    }
                })
            }
        } catch (error) { }
        //Video
        const type = data.status_type;
        if (type === 'video') {
            let videos: Array<string>;
            await page.waitForSelector(infoBox);
            for (let index = 1; index <= totalImages; index++) {
                let element = `#sf_result > div > div:nth-child(${index}) > div.info-box > div:nth-child(2) > div.drop-down-box > div.list > div > div > div > a`
                await page.waitForSelector(element, { timeout: 3000 });
                videos = await page.$$eval(`${element}`, (links) => links.map((link: HTMLAnchorElement) => link.href));
            }
            data.thumbnail = images[0];
            data.videos = videos.map(video => {
                return {
                    size: video.split('/')[6],
                    url: video
                }
            });
        }
        //Gif
        else if (type === 'gif') {
            await page.waitForSelector(infoBox);
            let element = `#sf_result > div > div:nth-child(${1}) > div.info-box > div:nth-child(2) > div.def-btn-box > a`
            await page.waitForSelector(element, { timeout: 3000 });
            data.gif = (await page.$$eval(`${element}`, (links) => links.map((link: HTMLAnchorElement) => link.href)));
        }
        if (url.includes('broadcasts')) {
            // console.log('Broadcast');
            /* Using the getBroadcast function to get the broadcast from the url. */
            // const broadcast = await getBroadcast(url);
            // data = {
            //     ...data,
            //     broadcast_url: broadcast,
            // }
            // data = {
            //     status: 'Not Implemented',
            // }
        }
        browser.close();
        return { success, message, data };
    } catch (error) {
        return { success: false, message: error.message, data: {} };
    }
}

// console.log(await twitter('https://twitter.com/Crunchyroll/status/1523060197'));// wrong url
// console.log(await twitter(''));// empty url
// console.log(await twitter('https://twitter.com/famitsu/status/1522788365644427264')); //4 images
// console.log(await twitter('https://twitter.com/Crunchyroll/status/1523347040570249217')); //3 images
// console.log(await twitter('https://twitter.com/Crunchyroll/status/1523120523047100416')); //2 image
// console.log(await twitter('https://twitter.com/Crunchyroll/status/1523091580118179841')); // 1 image
// console.log(await twitter('https://twitter.com/Crunchyroll/status/1523060197258063873'));// video
// console.log(await twitter('https://twitter.com/falcon_stefano/status/1523409687353327616')); //GIF
