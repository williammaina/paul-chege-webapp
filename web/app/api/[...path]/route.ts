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
