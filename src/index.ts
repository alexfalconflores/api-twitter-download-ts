// import Puppeteer in Typescript
import { launch } from 'puppeteer';

const URL = "https://en.savefrom.net/70/download-from-twitter";
let type: string;

const input = '#sf_url';
const button = '#sf_submit';
const result = '#sf_result';
const resultDiv = '#sf_result > div';
const infoBox = '#sf_result > div > div > div.info-box';

const scrape = async (url: string) => {
    try {
        if (url.length === 0) {
            throw new Error('URL is empty');
        }
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
            else {
                return 1;
            }
        });
        console.log(`Total images: ${totalImages}`);
        let images = [];
        // let images: Array<string>;
        try {
            if (totalImages === 0) {
                console.log("No images found");
            }
            else {
                for (let index = 1; index <= totalImages; index++) {
                    let element = `#sf_result > div.media-result > div:nth-child(${index}) > div.thumb-box.thumb-272 > a > img`;
                    await page.waitForSelector(element);
                    const imageElement = await page.$$eval(`${element}`, images => images.map((image: HTMLImageElement) => image.src));
                    const image = imageElement.toString();
                    images.push(image);
                }
            }
        } catch (error) {
            console.log(error);
        }
        if (images.length === 0) {
            return { error: 'No images found' };
        }
        else if (images.length > 0) {
            images.forEach(element => {
                if (element.includes('amplify_video_thumb')) type = 'video';
                else if (element.includes('tweet_video_thumb')) type = 'gif';
                else type = 'image';
            })
        }
        else {
            console.log('error');
            return { error: 'No images found' };
        }
        let data = {
            type,
            image_url: images,
        };
        if (type === 'video') {
            let videos: Array<string>;
            await page.waitForSelector(infoBox);
            for (let index = 1; index <= totalImages; index++) {
                let element = `#sf_result > div > div:nth-child(${index}) > div.info-box > div:nth-child(2) > div.drop-down-box > div.list > div > div > div > a`
                await page.waitForSelector(element);
                videos = await page.$$eval(`${element}`, (links) => links.map((link: HTMLAnchorElement) => link.href));
            }
            Object.assign(data, { video_url: videos });
        } else if (type === 'gif') {
            let gif: Array<string>;
            await page.waitForSelector(infoBox);
            for (let index = 1; index <= totalImages; index++) {
                let element = `#sf_result > div > div:nth-child(${index}) > div.info-box > div:nth-child(2) > div.def-btn-box > a`
                await page.waitForSelector(element);
                gif = await page.$$eval(`${element}`, (links) => links.map((link: HTMLAnchorElement) => link.href));
            }
            Object.assign(data, { gif_url: gif });
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
        return data;
    } catch (error) {
        return { error: error.message };
    }
}

// const getVideos = async (url) => {
//     // console.log('getVideos');
//     // console.log(url);
//     try {
//         const browser = await launch({ headless: false });
//         const page = await browser.newPage();
//         await page.setViewport({ width: 1920, height: 5000 });
//         await page.goto(URL, { timeout: 10000, waitUntil: 'domcontentloaded' });
//         await page.setJavaScriptEnabled(true);

//         // const input = '#sf_url';
//         // const button = '#sf_submit';
//         // const result = '#sf_result';
//         // const resultDiv = '#sf_result > div';

//         await page.waitForSelector(input);
//         const r = await page.$(input);
//         await r.type(url);

//         await page.click(button);
//         await page.waitForSelector(result);
//         await page.waitForSelector(resultDiv);
//         await page.waitForSelector(infoBox);

//         const totalImages = await page.evaluate(() => {
//             let parent = document.querySelector('#sf_result > div');
//             if (Object.entries(parent.children[0]).length === 0) {
//                 return (parent.childElementCount);
//             } else {
//                 return 1;
//             }
//         })

//         let array = [];
//         let videos: Array<string>;
//         if (totalImages === 0) {
//             console.log('Not Fount');
//         } else {
//             for (let index = 1; index <= totalImages; index++) {
//                 let e = `#sf_result > div > div:nth-child(${index}) > div.info-box > div:nth-child(2) > div.drop-down-box > div.list > div > div > div > a`
//                 // let element = `#sf_result > div.media-result > div:nth-child(${index}) > div.info-box > div.link-box > div:nth-child(2) > div:nth-child(2) > div > div > div`;
//                 await page.waitForSelector(e);
//                 videos = await page.$$eval(`${e}`, (links) => links.map((link: HTMLAnchorElement) => link.href));
//                 array.push(videos);
//             }
//             console.log('Array videos => ' + videos);
//         }
//         const videoUrl = array.flat();
//         browser.close();
//         return videoUrl;
//     } catch (error) {
//         console.log(error);
//     }
// }

// const getGif = async (url) => {
//     // console.log('getGif');
//     // console.log(url);
//     try {
//         const browser = await launch({ headless: false });
//         const page = await browser.newPage();
//         await page.setViewport({ width: 1920, height: 5000 });
//         await page.goto(URL, { timeout: 10000, waitUntil: 'domcontentloaded' });
//         await page.setJavaScriptEnabled(true);
//         await page.waitForSelector(input);
//         const r = await page.$(input);
//         await r.type(url);
//         await page.click(button);
//         await page.waitForSelector(result);
//         await page.waitForSelector(resultDiv);
//         await page.waitForSelector(infoBox);
//         const totalImages = await page.evaluate(() => {
//             let parent = document.querySelector('#sf_result > div');
//             if (Object.entries(parent.children[0]).length === 0) {
//                 return (parent.childElementCount);
//             } else {
//                 return 1;
//             }
//         })
//         console.log(totalImages);
//         let array = [];
//         if (totalImages === 0) {
//             console.log('Not Fount');
//         } else {
//             for (let index = 1; index <= totalImages; index++) {
//                 let element = `#sf_result > div > div:nth-child(${index}) > div.info-box > div:nth-child(2) > div.def-btn-box > a`
//                 await page.waitForSelector(element);
//                 const gift = await page.$$eval(`${element}`, (links) => links.map((link: HTMLAnchorElement) => link.href));
//                 array.push(gift);
//             }
//         }
//         const gifUrl = array.flat();
//         browser.close();
//         return gifUrl;
//     } catch (error) {
//         console.log(error);
//     }
// }

// const getBroadcast = async (url) => {
//     console.log('getBroadcast');
//     console.log(url);
//     try {
//         const browser = await launch({ headless: false });
//         const page = await browser.newPage();
//         await page.setViewport({ width: 1920, height: 5000 });
//         await page.goto(URL, { timeout: 10000, waitUntil: 'domcontentloaded' });
//         await page.setJavaScriptEnabled(true);
//         await page.waitForSelector(input);
//         const r = await page.$(input);
//         await r.type(url);
//         await page.click(button);
//         await page.waitForSelector(result);
//         await page.waitForSelector(resultDiv);
//         await page.waitForSelector(infoBox);
//         const totalImages = await page.evaluate(() => {
//             let parent = document.querySelector('#sf_result > div');
//             if (Object.entries(parent.children[0]).length === 0) {
//                 return (parent.childElementCount);
//             } else {
//                 return 1;
//             }
//         })
//         console.log(totalImages);
//         let array = [];
//         if (totalImages === 0) {
//             console.log('Not Fount');
//         } else {
//             for (let index = 1; index <= totalImages; index++) {
//                 let element = `#sf_result > div > div.result-box.video > div.info-box > div.link-box.single > div.def-btn-box > a`
//                 await page.waitForSelector(element);
//                 const broadcast = await page.$$eval(`${element}`, (links) => links.map((link: HTMLAnchorElement) => link.href));
//                 array.push(broadcast);
//             }
//         }
//         const broadcastUrl = array.flat();
//         browser.close();
//         return broadcastUrl;
//     } catch (error) {
//         console.log(error);
//     }
// }

(async () => {
    // console.log(await scrape('https://twitter.com/famitsu/status/1522788365644427264')); //4 imagenes
    // console.log(await scrape('https://twitter.com/Crunchyroll/status/1523347040570249217')); //3 imagenes
    // console.log(await scrape('https://twitter.com/Crunchyroll/status/1523120523047100416')); //2 imagenes
    // console.log(await scrape('https://twitter.com/Crunchyroll/status/1523091580118179841')); // 1 imagen
    // console.log(await scrape('https://twitter.com/Crunchyroll/status/1523060197258063873'));// video
    // console.log(await scrape('https://twitter.com/falcon_stefano/status/1523409687353327616')); //GIF

    // console.log(await scrape('https://twitter.com/i/broadcasts/1OyJADpMmNaGb')); // Broadcast
    // console.log(await scrape('https://twitter.com/falcon_stefano/status/3327616'));
})();

// console.log(await scrape('https://twitter.com/famitsu/status/1522788365644427264')); //4 imagenes
// console.log(await scrape('https://twitter.com/Crunchyroll/status/1523347040570249217')); //3 imagenes
// console.log(await scrape('https://twitter.com/Crunchyroll/status/1523120523047100416')); //2 imagenes
// console.log(await scrape('https://twitter.com/Crunchyroll/status/1523091580118179841')); // 1 imagen
// console.log(await scrape('https://twitter.com/Crunchyroll/status/1523060197258063873'));// video
// console.log(await scrape('https://twitter.com/falcon_stefano/status/1523409687353327616')); //GIF