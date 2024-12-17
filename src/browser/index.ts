import { Browser, Page, PuppeteerLaunchOptions } from "puppeteer";
import puppeteer from "puppeteer-extra";
import { SequenceOutput } from "@crawlora/sdk";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import PortalPlugin, { PluginOptions } from "puppeteer-extra-plugin-portal";
import AnonymizeUa from "puppeteer-extra-plugin-anonymize-ua";
import { ZProxy } from "./proxy";
import { z } from "zod";
import chromium from "@sparticuz/chromium";
import {
  CHROME_PATH,
  defaultProxyConfigs,
  forceShouldHideBrowser,
  forceShouldShowBrowser,
  forceUseProxyByDefault,
  getAuthKey,
  shouldShowBrowser,
} from "../config";
import { browserDebug } from "../util/debug";
import fs from "fs";
import os from "os";
import { SequenceStatus, updateSequenceStatus } from "../services";

type NonNegativeInteger<T extends number> = number extends T
  ? never
  : `${T}` extends `-${string}` | `${string}.${string}`
  ? never
  : T;

export const getRandomUserDir = () => {
  const userDir = fs.mkdtempSync(os.tmpdir() + "/puppet");
  return userDir;
};

export async function wait<N extends number>(sec: NonNegativeInteger<N>) {
  const shouldWait = sec * 1000;

  if (sec > 60) {
    const min = sec / 60;
    browserDebug(`waiting for ${min} min`);
  } else {
    browserDebug(`waiting for ${sec} sec`);
  }

  await new Promise((res, rej) => {
    setTimeout(() => {
      res(true);
    }, shouldWait);
  });
}

const defaultConfigs: PuppeteerLaunchOptions = {
  args: [
    "--no-sandbox",
    "--disable-web-security",
    "--disable-features=IsolateOrigins,site-per-process,SitePerProcess",
    "--flag-switches-begin",
    "--disable-site-isolation-trials",
    "--flag-switches-end",
    "--incognito",
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--single-process'
  ],
  headless: false,
};

export type Conf = {
  showBrowser?: boolean;
  apikey?: string;
  proxyConfig?: z.infer<typeof ZProxy>;
  remotePortalConfig?: Partial<PluginOptions>;
  browserPath?: string;
};

export type FunArgs = {
  puppeteer: Browser;
  page: Page;
  output: SequenceOutput;
  debug: debug.Debugger;
  wait: <N extends number>(sec: NonNegativeInteger<N>) => Promise<void>;
};

puppeteer.use(StealthPlugin());
puppeteer.use(AnonymizeUa());

export async function browser(
  func: (args: FunArgs) => Promise<void>,
  {
    showBrowser,
    apikey,
    proxyConfig,
    remotePortalConfig,
    browserPath,
  }: Conf = {},
  enableUpdate: boolean = true
) {
  if (!showBrowser) {
    showBrowser = shouldShowBrowser();
  }

  if (forceShouldShowBrowser()) {
    showBrowser = true;
  }

  if (forceShouldHideBrowser()) {
    showBrowser = false;
  }

  if (!apikey) {
    apikey = getAuthKey();
  }

  let browser: Browser | null = null;

  try {
    const executablePath = browserPath || (await CHROME_PATH());

    browserDebug(`executable path: ${executablePath}`);

    puppeteer.use(PortalPlugin(remotePortalConfig));

    let proxyUrl = "";

    const isProxyProvided = Object.keys(proxyConfig || {}).length > 1;

    if (!isProxyProvided && forceUseProxyByDefault()) {
      const proxy = defaultProxyConfigs();
      proxyConfig = {
        protocol: proxy.protocol,
        host: proxy.host,
        port: proxy.port,
        credential: {
          user_name: proxy.username,
          password: proxy.password,
        },
      };
    }

    if (proxyConfig) {
      const { host, protocol, port } = proxyConfig;
      proxyUrl = `${protocol}://${host}:${port}`;
    }

    browserDebug(`proxy: ${proxyUrl}`);

    const proxyLinks = proxyUrl ? `--proxy-server=${proxyUrl}` : "";

    browserDebug("proxy sever " + proxyLinks);

    const args = [proxyLinks, ...chromium.args, ...(defaultConfigs?.args || [])]
      .map((v) => v)
      .filter((v) =>
        (
          [
            "--headless",
            "",
            "--headless='shell'",
            "--single-process", // on desktop this is not a valid options
          ] as string[]
        ).includes(v)
          ? false
          : true
      );

    browserDebug(`args: ${JSON.stringify(args)}`);

    const conf = {
      ...defaultConfigs,
      args,
      headless: !showBrowser,
      executablePath,
    };

    browserDebug(`launching browser`);

    browser = await puppeteer.launch(conf);

    browserDebug(`launched browser`);

    const allPages = await browser.pages();

    // close 1 page
    await allPages.at(1)?.close();

    const page = allPages.at(0);

    if (!page) {
      throw new Error(`No page created`);
    }

    if (
      proxyConfig &&
      proxyConfig.credential &&
      Object.values(proxyConfig.credential).length === 2
    ) {
      await page.authenticate({
        username: proxyConfig.credential.user_name,
        password: proxyConfig.credential.password,
      });
    }

    browserDebug(`launched new page`);

    const output = new SequenceOutput(apikey);

    browserDebug(`running callback function`);

    //send start event to the api

    // in_progress
    if (enableUpdate)
      await updateSequenceStatus(SequenceStatus.InProgress, apikey);

    await func({ puppeteer: browser, page, output, debug: browserDebug, wait });

    if (enableUpdate)
      await updateSequenceStatus(SequenceStatus.Success, apikey);

    //complete
    browserDebug(`successfully running callback function`);
  } catch (e) {
    // send error event to the api
    browserDebug(`received an error`);

    if (enableUpdate) {
      await updateSequenceStatus(
        SequenceStatus.Failed,
        apikey,
        (e as Error).stack || (e as Error).message
      );
    }

    throw e;
  } finally {
    browserDebug(`closing the browser`);
    await browser?.close();
  }
}
