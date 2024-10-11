import { Browser, Page, PuppeteerLaunchOptions } from "puppeteer";
import puppeteer from 'puppeteer-extra'
import { SequenceOutput } from "@crawlora/sdk";
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import PortalPlugin, { PluginOptions } from 'puppeteer-extra-plugin-portal';
import AnonymizeUa from 'puppeteer-extra-plugin-anonymize-ua';
import { ZProxy } from "./proxy";
import { z } from "zod";
import chromium from '@sparticuz/chromium';
import { CHROME_PATH } from "../config";
import { browserDebug } from "../util/debug";


type NonNegativeInteger<T extends number> =
    number extends T 
        ? never 
        : `${T}` extends `-${string}` | `${string}.${string}`
            ? never 
            : T;

export async function wait<N extends number>(sec: NonNegativeInteger<N>){
  const shouldWait = sec * 1000
  browserDebug(`waiting for ${shouldWait} sec`)
  await new Promise((res, rej) => {
    setTimeout(() => {
      res(true)
    }, shouldWait)
  })
}

const defaultConfigs: PuppeteerLaunchOptions = {
  args: [
    "--no-sandbox",
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process,SitePerProcess',
    '--flag-switches-begin',
    '--disable-site-isolation-trials',
    '--flag-switches-end',
  ],
  headless: false
}

export type Conf = {
showBrowser?: boolean,
apikey?: string,
proxyConfig?: z.infer<typeof ZProxy>,
remotePortalConfig?: Partial<PluginOptions>,
browserPath?: string
}

export type FunArgs = 
{ 
  puppeteer: Browser;
  page: Page;
  output: SequenceOutput;
  debug: debug.Debugger,
  wait: <N extends number>(sec: NonNegativeInteger<N>) => Promise<void>
};

puppeteer.use(StealthPlugin())
puppeteer.use(AnonymizeUa())



export async function browser(
  func: (args: FunArgs) => Promise<void>,
  conf? :Conf
) {

  const {
    showBrowser,
    apikey,
    proxyConfig,
    remotePortalConfig,
    browserPath,
  } = conf || { showBrowser: false }



  let browser: Browser | null = null;
  
  try {
    const executablePath = browserPath || await CHROME_PATH();

    browserDebug(`executable path: ${executablePath}`)
    
    puppeteer.use(PortalPlugin(remotePortalConfig))
    
    let proxyUrl = '';
    
    if (proxyConfig) {
      const { host, protocol, port } = proxyConfig;
      proxyUrl = `${protocol}://${host}:${port}`;
    }

    browserDebug(`proxy: ${proxyUrl}`)

    
    const proxyLinks = proxyUrl ? `--proxy-server=${proxyUrl}` : '';

    browserDebug("proxy sever " + proxyLinks)
    
    const args = [proxyLinks, ...chromium.args, ...defaultConfigs?.args || []]
    .map((v) => v)
    .filter((v) => (([
      '--headless', 
      '', 
      "--headless='shell'",
      '--single-process' // on desktop this is not a valid options
    ] as string[]).includes(v) ? false : true))
    
    browserDebug(`args: ${JSON.stringify(args)}`)

    const conf = {...defaultConfigs, args, headless: !showBrowser, executablePath }
    
    browserDebug(`launching browser`)

    browser = await puppeteer.launch(conf);

    browserDebug(`launched browser`)


    browserDebug(`launching new page`)

    const page = await browser.newPage()
    if (proxyConfig && proxyConfig.credential) {
    await page.authenticate({ username: proxyConfig.credential?.user_name, password: proxyConfig.credential?.password})
    }
    browserDebug(`launched new page`)
    
    const output = new SequenceOutput(apikey)
    
    browserDebug(`running callback function`)

    await func({ puppeteer: browser, page, output, debug: browserDebug, wait  });

    browserDebug(`successfully running callback function`)


  } catch (e) {
    browserDebug(`received an error`)

    throw e;
  } finally {
    browserDebug(`closing the browser`)

    await browser?.close();
  }
}
