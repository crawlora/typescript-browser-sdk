import chromium from '@sparticuz/chromium';

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
  

  