// eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-imports
import type { SAFE_ANY } from './type';

import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import asyncRetry from 'async-retry';
import fetch from 'node-fetch-native';

import { createOraSpinner } from './utils';

/**
 * Fetch file
 * @param url File url
 * @returns
 */
export const fetchFile = async (url: string): Promise<Response> => {
  const res = await fetch(url);

  if (!res.body) {
    throw new Error(`Failed to fetch: ${url}`);
  }

  return res;
};

/**
 * Fetch file stream
 * @param url File url
 * @returns
 */
const fetchFileStream = async (url: string) => {
  const res = await fetchFile(url);

  return Readable.fromWeb(res.body!);
};

const createFileIfNotExisted = async (filepath: string) => {
  const dir = dirname(filepath);

  if (existsSync(dir)) {
    return;
  }

  mkdirSync(dir, { recursive: true });
};

/**
 * Download remote file
 * @param dir Directory
 * @param url File url
 * @param retries Retry times
 */
export const downloadFile = async (filepath: string, url: string, retries?: number) => {
  const filename = basename(url);
  const spinner = createOraSpinner(`Downloading ${filename}`);

  await asyncRetry(
    async (bail) => {
      await createFileIfNotExisted(resolve(process.cwd(), filepath));

      try {
        await pipeline(await fetchFileStream(url), createWriteStream(filepath));
        spinner.stop();
      } catch (err: SAFE_ANY) {
        spinner.stop();
        bail(new Error(err.message));
      }
    },
    {
      retries: retries ?? 5,
    },
  ).finally(() => {
    spinner.stop();
  });
};
