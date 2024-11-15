import { Sequence } from "@crawlora/sdk";
import { getSequenceId, hasSequenceId } from "../config";
import { browserDebug } from "../util/debug";

export enum SequenceStatus {
    InProgress = "in_progress",
    Success = "success",
    Failed = "failed",
}

export async function updateSequenceStatus(
    status: SequenceStatus,
    apikey: string,
    errorMsg?: string
) {
    if (!hasSequenceId()) return;

    const seq = new Sequence(apikey);

    const statusData: {
        status: SequenceStatus;
        error?: string;
    } = { status };

    if (status === SequenceStatus.Failed && errorMsg) {
        statusData.error = errorMsg;
    }

    try {
        browserDebug(`updating the status to ${status}`);
        await seq.update(getSequenceId(), statusData);
    } catch (e) {
        browserDebug(
            `could not update status to ${status} because ${(e as Error).message}`
        );
        console.error(e);
    }
}

