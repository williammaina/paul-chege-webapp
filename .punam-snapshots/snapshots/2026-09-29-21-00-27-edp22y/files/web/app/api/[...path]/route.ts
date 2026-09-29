import { handleRequest } from "../../../../paul-chege-tv/server/index.mjs";
import { runNodeHandler } from "@/lib/server/node-adapter.mjs";

/**
 * Every `/api/*` route, served by the same router the standalone server
 * uses. There is one implementation of checkout, the diary, the callback
 * and the download; this file only translates between Web and Node.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const serve = (request: Request) => runNodeHandler(handleRequest, request);

export const GET = serve;
export const POST = serve;
export const OPTIONS = serve;

/* HEAD is not optional. Next answers 404 for a method with no export, and
   uptime monitors and load balancers probe with HEAD — without this the
   health endpoint reports the service as permanently down. The router
   treats it as a GET and the runtime drops the body. */
export const HEAD = serve;
