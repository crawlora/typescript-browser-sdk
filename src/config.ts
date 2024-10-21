import chromium from '@sparticuz/chromium';
import { z } from "zod";
import { ZProxy } from "./browser/proxy";

export const getEnv = (key: string, def?: string, shouldCrash = true)  => {
    const { env } = process
    const value = env[key] || def;
    if(typeof value !== 'string' && shouldCrash === true){
            throw new Error(`env ${key} did not found in env`)
    }
    return value
}


export const CHROME_PATH = async () =>
    process.env['PUPPETEER_EXECUTABLE_PATH'] || (await chromium.executablePath());

export const shouldShowBrowser = () => process.env['SHOW_BROWSER'] === 'true'
export const forceShouldShowBrowser = () => process.env['FORCE_SHOW_BROWSER'] === 'true'
export const forceShouldHideBrowser = () => process.env['FORCE_HIDE_BROWSER'] === 'true'

export const forceUseProxyByDefault = () => process.env['FORCE_USE_PROXY'] === 'true'

export const getSequenceId = () => {
  if(!process.env['CRAWLORA_SEQUENCE_ID']){
    throw new Error(`CRAWLORA_SEQUENCE_ID not found`)
  }

  return process.env['CRAWLORA_SEQUENCE_ID']
}

export const getAuthKey = () => {
  const authKey = process.env['CRAWLORA_AUTH_KEY']
  if(!authKey){
    throw new Error(`No Auth Key found`)
  }

  return authKey
}

export const hasSequenceId = () => {
  return Boolean(process.env['CRAWLORA_SEQUENCE_ID'])
}

export const defaultProxyConfigs = () => {
  const { env } = process
  const protocol = (env['FORCE_PROXY_PROTOCOL'] || 'http') as z.infer<typeof ZProxy>['protocol']
  const username = env['FORCE_PROXY_USERNAME']
  const password = env['FORCE_PROXY_PASSWORD']
  const host = env['FORCE_PROXY_HOST']
  const port = Number(env['FORCE_PROXY_PORT'])

  if(Number.isNaN(port)){
    throw new Error(`NaN detected: invalid port value has been provided value=${env['FORCE_PROXY_PORT']} cannot convert to number `)
  }

  if(!username || !password || !host || !port){
    throw new Error(`credentials do not found for proxy`)
  }

  return {
    protocol,
    username,
    password,
    host,
    port
  }
}
  

  