
export class Duration {
    public value: number = 0;
    public timeUnit: 'H' | 'M' | 'S' = 'S';

    constructor(private readonly _rawValue: string) {
        this.parseDuration();
    }

    private parseDuration(): void {
        // Expected format: PT<number><unit> where unit is H, M, or S
        const regex = /^PT(\d+(?:\.\d+)?)([HMS])$/;
        const match = regex.exec(this._rawValue);
        this.value = parseFloat(match?.[1] ?? '0');
        this.timeUnit = (match?.[2] as 'H' | 'M' | 'S') ?? 'S';
    }

    public get seconds(): number {
        switch (this.timeUnit) {
            case 'H':
                return this.value * 3600;
            case 'M':
                return this.value * 60;
            case 'S':
                return this.value;
            default:
                return 0;
        }
    }

    public get milliseconds(): number {
        return this.seconds * 1000;
    }
}

export class Descriptor {
    constructor(public value: string) {
    }
}
