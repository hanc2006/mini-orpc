import { parseEmptyableJSON, tryDecodeURIComponent } from "@orpc/shared";

export interface StandardHeaders {
  [key: string]: string | string[] | undefined;
}

export type StandardBody =
  | undefined
  | unknown
  | Blob
  | URLSearchParams
  | FormData
  | AsyncIterator<unknown, unknown, undefined>;

export interface StandardRequest {
  method: string;
  url: URL;
  headers: StandardHeaders;

  /**
   * The body has been parsed based on the content-type header.
   */
  body: StandardBody;

  signal: AbortSignal | undefined;
}

export interface StandardLazyRequest extends Omit<StandardRequest, 'body'> {
  /**
   * The body has been parsed based on the content-type header.
   * This method can safely call multiple times (cached).
   */
  body: () => Promise<StandardBody>;
}

export interface StandardResponse {
  status: number;
  headers: StandardHeaders;
  /**
   * The body has been parsed based on the content-type header.
   */
  body: StandardBody;
}


export function getFilenameFromContentDisposition(contentDisposition: string): string | undefined {
  const encodedFilenameStarMatch = contentDisposition.match(/filename\*=(UTF-8'')?([^;]*)/i)

  if (encodedFilenameStarMatch && typeof encodedFilenameStarMatch[2] === 'string') {
    return tryDecodeURIComponent(encodedFilenameStarMatch[2])
  }

  const encodedFilenameMatch = contentDisposition.match(/filename="((?:\\"|[^"])*)"/i)
  if (encodedFilenameMatch && typeof encodedFilenameMatch[1] === 'string') {
    return encodedFilenameMatch[1].replace(/\\"/g, '"')
  }
}


export async function toStandardBody(re: Request | Response): Promise<StandardBody> {
  const contentDisposition = re.headers.get('content-disposition')

  if (typeof contentDisposition === 'string') {
    const fileName = getFilenameFromContentDisposition(contentDisposition) ?? 'blob'

    const blob = await re.blob()
    return new File([blob], fileName, {
      type: blob.type,
    })
  }

  const contentType = re.headers.get('content-type')

  if (!contentType || contentType.startsWith('application/json')) {
    const text = await re.text()
    return parseEmptyableJSON(text)
  }

  if (contentType.startsWith('multipart/form-data')) {
    return await re.formData()
  }

  if (contentType.startsWith('application/x-www-form-urlencoded')) {
    const text = await re.text()
    return new URLSearchParams(text)
  }

  if (contentType.startsWith('text/plain')) {
    return await re.text()
  }

  const blob = await re.blob()
  return new File([blob], 'blob', {
    type: blob.type,
  })
}


export function toStandardHeaders(headers: Headers, standardHeaders: StandardHeaders = {}): StandardHeaders {
  for (const [key, value] of headers) {
    if (Array.isArray(standardHeaders[key])) {
      standardHeaders[key].push(value)
    }
    else if (standardHeaders[key] !== undefined) {
      standardHeaders[key] = [standardHeaders[key], value]
    }
    else {
      standardHeaders[key] = value
    }
  }

  return standardHeaders
}