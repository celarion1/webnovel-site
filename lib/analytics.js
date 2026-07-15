// novels.js와 동일한 패턴: Redis 환경변수가 있으면 Redis, 없으면 로컬 파일 사용.
import * as fileImpl from "./analytics-file";
import * as redisImpl from "./analytics-redis";

const useRedis = redisImpl.hasRedisEnv();
const impl = useRedis ? redisImpl : fileImpl;

export const recordPageview = impl.recordPageview;
export const getStats = impl.getStats;
