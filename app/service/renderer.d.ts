import {electronApi} from './ipc'
import { JX } from './jx-define'

declare global {
    interface IElectionApi {
        openDialog: () => Promise<any>
        startDrag: (fileName: string) => void
    }

    interface Window {
        [electronApi]: IElectionApi,
    }
}

export {}