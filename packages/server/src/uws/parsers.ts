/** biome-ignore-all lint/style/useBlockStatements: <> */
import uWS from 'uWebSockets.js';

export interface UploadedFile {
  data: ArrayBuffer;
  filename: string;
  type: string;
}

export type ParsedBody =
  | Record<string, string | Buffer | ArrayBufferLike>
  | undefined;

export type ParsedFiles =
  | Record<string, UploadedFile | UploadedFile[] | undefined>
  | undefined;

export type ParsedQuery = Record<string, string> | undefined;

/**
 * Reads the body from the response stream and checks headers/content.
 */
async function getBody(
  req: uWS.HttpRequest,
  res: uWS.HttpResponse
): Promise<Buffer | undefined> {
  let buffer: Buffer;

  const body = await new Promise<Buffer | undefined>((resolve) =>
    res.onData((ab, isLast) => {
      const chunk = Buffer.from(ab);
      if (isLast) {
        if (buffer) resolve(Buffer.concat([buffer, chunk]));
        else resolve(chunk);
      } else if (buffer) {
        buffer = Buffer.concat([buffer, chunk]);
      } else {
        buffer = Buffer.concat([chunk]);
      }
    })
  );

  return body;
}

/**
 * Parses a query string into an object.
 * @param query The query string, e.g. "foo=bar&baz=qux"
 */
export function parseQuery(query: string): ParsedQuery {
  const obj = {} as ParsedQuery;

  const pairs = query.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && obj)
      obj[decodeURIComponent(key)] = decodeURIComponent(value ?? '');
  }
  return obj;
}

/**
 * Parses the body of a request, auto-detecting by content type.
 */
export async function parseBody(
  req: uWS.HttpRequest,
  res: uWS.HttpResponse
): Promise<ParsedBody> {
  const body = await getBody(req, res);

  if (!body) return;

  const contentType = req.getHeader('content-type');

  if (
    contentType === 'application/json' ||
    contentType === 'application/x-www-form-urlencoded'
  ) {
    const bodyStr = body.toString();
    if (!bodyStr) return;

    return contentType === 'application/json'
      ? JSON.parse(bodyStr)
      : parseQuery(bodyStr);
  }
  if (contentType.startsWith('multipart/form-data')) {
    const data: Record<string, string | Buffer> = {};

    const parts = uWS.getParts(body, contentType);
    if (!parts) return;

    for (const p of parts) {
      if (!(p.type || p.filename))
        data[p.name] = Buffer.from(p.data).toString();
    }
    return data;
  }

  return;
}

/**
 * Parses the files from a multipart/form-data request.
 */
export async function parseFile(
  req: uWS.HttpRequest,
  res: uWS.HttpResponse
): Promise<ParsedFiles> {
  const body = await getBody(req, res);

  if (!body) return;

  const contentType = req.getHeader('content-type');

  if (contentType.startsWith('multipart/form-data')) {
    const data: ParsedFiles = {};
    const parts = uWS.getParts(body, contentType);

    if (!parts) return;

    for (const p of parts) {
      if (p.type && p.filename) {
        const name = p.name.slice(-2) === '[]' ? p.name.slice(0, -2) : p.name;
        const value = { data: p.data, filename: p.filename, type: p.type };
        if (data[name] === undefined)
          data[name] = p.name.slice(-2) === '[]' ? [value] : value;
        else if (Array.isArray(data[name]))
          (data[name] as UploadedFile[]).push(value);
        else data[name] = [data[name] as UploadedFile, value];
      }
    }
    return data;
  }
  return;
}
