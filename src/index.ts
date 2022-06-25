// import Puppeteer in Typescript
import {Puppeteer} from 'puppeteer';
const puppeteer = require('puppeteer');

const scrape = async (url: string) => {
    try {
        if(url.length === 0) {
            throw new Error('URL is empty');
        }
        const browser = await ({});
    } catch (error) {
        
    }
}