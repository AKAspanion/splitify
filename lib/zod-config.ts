import { z } from "zod";

// Zod probes `new Function("")` to compile faster parsers, and a Content-Security-Policy without `'unsafe-eval'`
// reports that probe as a violation even though zod catches it. The parsers here are small, so skip the probe.
z.config({ jitless: true });
