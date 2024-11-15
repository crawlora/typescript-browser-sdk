import { browser, Conf, FunArgs } from "../browser";
import { browserDebug } from "../util/debug";
import { SequenceStatus, updateSequenceStatus } from "../services";
import { getAuthKey } from "../config";

export async function window<T>(
    formedData: T[],
    func: (value: T, args: FunArgs, config: Conf) => Promise<void>,
    conf: Conf = {}
) {
    const apikey = conf.apikey || getAuthKey();

    try {
        // Update status to "in_progress" at the start
        await updateSequenceStatus(SequenceStatus.InProgress, apikey);

        for await (const data of formedData) {
            await browser(async (args) => {
                await func(data, args, conf);

                // Sleep for a few seconds
                await args.wait(2)
            }, conf, false);
        }
    } catch (e) {
        browserDebug(`received an error`);

        // Update status to "failed" if an error occurs
        await updateSequenceStatus(SequenceStatus.Failed, apikey, (e as Error).stack || (e as Error).message);

        throw e;
    } finally {
        // Update status to "success" on completion
        await updateSequenceStatus(SequenceStatus.Success, apikey);
    }
}
