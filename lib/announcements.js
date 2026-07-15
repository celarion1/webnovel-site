// novels.js / analytics.js와 동일한 패턴: Redis 환경변수가 있으면 Redis, 없으면 로컬 파일 사용.
import * as fileImpl from "./announcements-file";
import * as redisImpl from "./announcements-redis";

const useRedis = redisImpl.hasRedisEnv();
const impl = useRedis ? redisImpl : fileImpl;

export const recordEpisodeAdded = impl.recordEpisodeAdded;
export const getAnnouncements = impl.getAnnouncements;
