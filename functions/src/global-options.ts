// Options every function starts from. index.ts imports this module first: a function reads the global options when it
// is defined, so they must be set before any function module loads.
import { setGlobalOptions } from "firebase-functions/v2";

// No function scales past 10 instances, which bounds what a flood of requests can cost. A function may set its own
// lower cap, as the budget kill switch does.
setGlobalOptions({ maxInstances: 10 });
