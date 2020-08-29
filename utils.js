const fs = require('fs');
const path = require('path');
const util = require('util');
const request = require('request-promise-native');
const semaphore = require('semaphore');

const sem = require('semaphore')(3);

async function fileExists (path) {
  try {
    const stats = await fs.promises.stat(path)
    return stats.isFile()
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err
    }
    return false
  }
}

const CACHE_DIR = '/tmp'

async function cacheOperation (name, operationFunc, cacheDir = CACHE_DIR) {
  const cacheFilePath = path.resolve(path.join(cacheDir, name))
  if (process.env.DISABLE_CACHE !== 'true') {
    if (await fileExists(cacheFilePath)) {
      const json = await fs.promises.readFile(cacheFilePath)
      return JSON.parse(json)
    }
  }

  const result = await operationFunc()
  await fs.promises.writeFile(cacheFilePath, JSON.stringify(result, null, 2))
  return result
}

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    sem.take(async () => {
      try {
        const options = typeof url === 'object' ? url : { url, resolveWithFullResponse: true };
        const method = (options.method || '').toUpperCase() || 'GET'
        options.resolveWithFullResponse = true;
        console.log(`request (${method}): ${options.url}`);

        const response = await request(options);
        const { statusCode: status, statusMessage: statusText, body: data, headers } = response;
        
        resolve({ status, statusText, data, headers });
      } catch (e) {
        reject(e);
      } finally {
        sem.leave();
      }
    });
  })
}

exports.makeRequest = makeRequest;
exports.cacheOperation = cacheOperation;
