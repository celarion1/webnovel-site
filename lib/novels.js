// 스토리지 백엔드 디스패처.
// Redis 연결 정보(KV_REST_API_URL/TOKEN 등)가 있으면 Redis를,
// 없으면(주로 로컬 개발) 로컬 content/ 폴더 파일을 사용함.
import * as fileImpl from "./novels-file";
import * as redisImpl from "./novels-redis";

const useRedis = redisImpl.hasRedisEnv();
const impl = useRedis ? redisImpl : fileImpl;

export const getNovels = impl.getNovels;
export const getNovel = impl.getNovel;
export const getEpisode = impl.getEpisode;
export const getEpisodeRaw = impl.getEpisodeRaw;
export const createNovel = impl.createNovel;
export const createEpisode = impl.createEpisode;
export const updateNovel = impl.updateNovel;
export const updateEpisode = impl.updateEpisode;
export const moveEpisode = impl.moveEpisode;
export const deleteNovel = impl.deleteNovel;
export const deleteEpisode = impl.deleteEpisode;
export const friendlyFsError = impl.friendlyError;
export const usingRedis = useRedis;
