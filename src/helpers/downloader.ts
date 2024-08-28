import fs from 'node:fs';
import path from 'node:path';
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
async function fetchFileStream(url: string) {
  const res = await fetch(url);

  if (!res.body) {
    throw new Error(`Failed to download: ${url}`);
  }

  return Readable.fromWeb(res.body);
}

/**
 * Download remote file
 * @param dir Directory
 * @param url File url
 * @param retries Retry times
 */
export const downloadFile = async (dir: string, url: string, retries?: number) => {
  const filename = path.basename(url);
  const spinner = createOraSpinner(`Downloading ${filename}`);

  await asyncRetry(
    async (bail) => {
      try {
        await pipeline(
          await fetchFileStream(url),
          fs.createWriteStream(path.join(dir, `./${filename}`)),
        );
      } catch (err) {
        bail(new Error(`Failed to download ${url} Error: ${err}`));
      }
    },
    {
      retries: retries ?? 5,
    },
  ).finally(() => {
    spinner.stop();
  });
};

downloadFile(process.cwd(), 'https://raw.githubusercontent.com/shaw996/shawkit/main/.editorconfig');
