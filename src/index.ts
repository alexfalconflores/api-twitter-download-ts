import { launch, Page } from 'puppeteer';
import { IResponse, IData, IVideo } from './Interface/IData';

const URL = "https://en.savefrom.net/70/download-from-twitter";
let response: IResponse =
{
    success: false,
    message: '',
    data: {}
};

const input = '#sf_url';
const button = '#sf_submit';
const result = '#sf_result';
const resultDiv = '#sf_result > div';
const infoBox = '#sf_result > div > div > div.info-box';

const twitter = async (url: string) => {
    if (url.length !== 0) {
        if (url.includes('twitter')) {
            if (!url.includes('broadcasts')) {
                const username = url.split('/')[3];
                return download(url, username);
            } else {
                response.message = 'Not supported';
                return response;
            }
        } else {
            response.message = 'Not a twitter url';
            return response;
        }
    } else {
        response.message = 'Url is empty';
        return response;
    }
}

const download = async (url: string, username: string) => {
    try {
        let images: string[] = [];
        let data: IData = { url: url, username: username, status_type: '' };
        const browser = await launch({ headless: true });
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
            for (let index = 1; index <= totalImages; index++) {
                let element = `#sf_result > div > div.result-box.simple.center.result-failure`;
                await page.waitForSelector(element, { timeout: 2000 });
                const messageError = await getTextContext(page, element);
                response.message = messageError.toString();
            }
            browser.close();
            return response;
        } catch (error) { }

        try {
            for (let index = 1; index <= totalImages; index++) {
                let element = `#sf_result > div.media-result > div:nth-child(${index}) > div.thumb-box.thumb-272 > a > img`;
                await page.waitForSelector(element, { timeout: 3000 });
                const image = await getImage(page, element);
                images.push(image);
            }
            if (images.length > 0) {
                response.success = true;
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
            let videosArray: string[] = [];
            await page.waitForSelector(infoBox);
            for (let index = 1; index <= totalImages; index++) {
                let element = `#sf_result > div > div:nth-child(${index}) > div.info-box > div:nth-child(2) > div.drop-down-box > div.list > div > div > div > a`
                await page.waitForSelector(element, { timeout: 3000 });
                videosArray = await getHyperlink(page, element);
            }
            data.thumbnail = images[0];
            data.videos = videosArray.map(video => {
                let videoObject: IVideo = {
                    size: video.split('/')[6],
                    url: video,
                }
                return videoObject;
            });
        }
        //Gif
        else if (type === 'gif') {
            await page.waitForSelector(infoBox);
            let element = `#sf_result > div > div:nth-child(${1}) > div.info-box > div:nth-child(2) > div.def-btn-box > a`
            await page.waitForSelector(element, { timeout: 3000 });
            data.gif = await getHyperlink(page, element);
        }
        browser.close();
        response.data = data;
        return response;
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { success: false, message: error.message, data: {} };
        }
    }
}

const getTextContext = async (page: Page, element: string): Promise<(string | null)[]> => {
    return await page.$$eval(`${element}`, texts => texts.map(text => text.textContent)); //HTMLDivElement
}

const getImage = async (page: Page, element: string): Promise<string> => {
    return (await page.$$eval(`${element}`, images => images.map(image => {
        let img = image as HTMLImageElement;
        return img.src;
    }))).toString();
}

const getHyperlink = async (page: Page, element: string): Promise<string[]> => {
    return await page.$$eval(`${element}`, links => links.map(link => {
        let hyperlink = link as HTMLAnchorElement;
        return hyperlink.href;
    }))
}

// console.log(await twitter('https://twitter.com/Crunchyroll/status/1523060197')); // wrong url
// console.log(await twitter('')); // empty url
// console.log(await twitter('https://twitter.com/i/broadcasts/1OyJADpMmNaGb')); // Broadcast

console.log(await twitter('https://twitter.com/famitsu/status/1522788365644427264')); //4 images
// console.log(await twitter('https://twitter.com/Crunchyroll/status/1523347040570249217')); //3 images
// console.log(await twitter('https://twitter.com/Crunchyroll/status/1523120523047100416')); //2 image
// console.log(await twitter('https://twitter.com/Crunchyroll/status/1523091580118179841')); // 1 image
// console.log(await twitter('https://twitter.com/Crunchyroll/status/1523060197258063873')); // video
// console.log(await twitter('https://twitter.com/falcon_stefano/status/1523409687353327616')); //GIF

