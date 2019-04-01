import { AbstractUniverseLog } from "universe-log";

export class Log extends AbstractUniverseLog {
    public static log(): Log {
        return Log.INSTANCE;
    }
    private static INSTANCE: Log = new Log();

    private constructor() {
        super({
            levelEnvs: ["STEEM_CONTENT_RENDERER_LOG_LEVEL", "ENGRAVE_LOG_LEVEL"],
            metadata: {
                library: "steem-content-renderer",
            },
        });
    }

    public initialize() {
        super.init();
    }

    public init() {
        throw new Error("Instead of #init() please call #initialize() which indirectly overrides init");
    }
}
