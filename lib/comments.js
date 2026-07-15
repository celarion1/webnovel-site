// novels.js와 동일한 패턴: Redis 환경변수가 있으면 Redis, 없으면 로컬 파일 사용.
import * as fileImpl from "./comments-file";
import * as redisImpl from "./comments-redis";

const useRedis = redisImpl.hasRedisEnv();
const impl = useRedis ? redisImpl : fileImpl;

export const getComments = impl.getComments;
export const addComment = impl.addComment;
export const deleteComment = impl.deleteComment;
