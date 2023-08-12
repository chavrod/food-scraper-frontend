import redis from "@/utils/redis";

interface CacheResultsArgs {
  keyword: string;
  page: number | string;
  results: any;
}

export async function cacheResults(args: CacheResultsArgs) {
  try {
    console.log(`STORING RESULTS FOR: ${args.keyword}:${args.page}...`);
    const key = `${args.keyword}:${args.page}`;
    const value = JSON.stringify(args.results);
    await redis.set(key, value, "EX", 3600); // Expires in 1 hour
    console.log("RESULTS HAVE BEEN STORED!");
  } catch (err) {
    console.log("ERROR STORING RESULTS: ", err);
  }
}

export async function getCachedResults(keyword: string, page: string) {
  try {
    console.log(`CHECKING FOR DATA.... ${keyword}:${page}`);
    const key = `${keyword}:${page}`;
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.log("ERROR CHECKING FOR DATA: ", err);
  }
}
