export class CancellationToken {
    constructor() {
        this.cancelRequested = false;
    }

    cancel() {
        this.cancelRequested = true;
    }
}