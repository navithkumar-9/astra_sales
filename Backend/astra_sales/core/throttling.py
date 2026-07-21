import time
from rest_framework.throttling import BaseThrottle
from django_redis import get_redis_connection

class TokenBucketRateThrottle(BaseThrottle):
    """
    Token bucket algorithm for rate limiting, backed by Redis Lua scripting.
    """
    
    # 30 requests per minute = 0.5 requests per second
    rate_limit = 30
    # Capacity of the bucket
    bucket_capacity = 30
    
    LUA_SCRIPT = """
    local tokens_key = KEYS[1]
    local timestamp_key = KEYS[2]
    local rate = tonumber(ARGV[1])
    local capacity = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    local requested = 1

    local fill_time = capacity / rate
    local ttl = math.floor(fill_time * 2)
    if ttl < 60 then
        ttl = 60
    end

    local last_tokens = tonumber(redis.call("get", tokens_key))
    if last_tokens == nil then
        last_tokens = capacity
    end

    local last_refreshed = tonumber(redis.call("get", timestamp_key))
    if last_refreshed == nil then
        last_refreshed = 0
    end

    local delta = math.max(0, now - last_refreshed)
    local filled_tokens = math.min(capacity, last_tokens + (delta * rate))
    local allowed = filled_tokens >= requested
    
    local new_tokens = filled_tokens
    if allowed then
        new_tokens = filled_tokens - requested
    end

    redis.call("setex", tokens_key, ttl, new_tokens)
    redis.call("setex", timestamp_key, ttl, now)

    return { allowed and 1 or 0, new_tokens }
    """

    def __init__(self):
        self.redis_conn = get_redis_connection("default")
        self._script = self.redis_conn.register_script(self.LUA_SCRIPT)
        super().__init__()

    def get_cache_key(self, request, view):
        if request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        return f"throttle_{ident}"

    def allow_request(self, request, view):
        key = self.get_cache_key(request, view)
        tokens_key = f"{key}_tokens"
        timestamp_key = f"{key}_ts"
        
        now = time.time()
        rate = self.rate_limit / 60.0  # requests per second
        
        try:
            result = self._script(
                keys=[tokens_key, timestamp_key],
                args=[rate, self.bucket_capacity, now]
            )
            allowed, _ = result
            return bool(allowed)
        except Exception:
            # If Redis fails, degrade gracefully and allow request
            return True

    def wait(self):
        """
        Return the recommended number of seconds to wait before
        the next request. In a simple implementation we just return 1.
        """
        return 1
