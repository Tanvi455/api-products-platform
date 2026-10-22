import time

from rate_limiters import LeakyBucket, QueueLeakyBucket, TokenBucket


def run(name, limiter, requests=12, gap=0.1):
    print(f"\n=== {name} ===")
    start = time.monotonic()
    for i in range(1, requests + 1):
        ok = limiter.allow()
        print(f"t={time.monotonic() - start:4.1f}s  request {i:2d}: {'ALLOWED' if ok else 'REJECTED'}")
        time.sleep(gap)


# capacity 5, 2 per second; 10 requests/second arrive
run("Token Bucket (capacity=5, rate=2/s)", TokenBucket(5, 2))
run("Leaky Bucket - meter (capacity=5, rate=2/s)", LeakyBucket(5, 2))

print("\n=== Leaky Bucket - queue (capacity=5, rate=2/s) ===")
start = time.monotonic()
qb = QueueLeakyBucket(5, 2, lambda i: print(f"t={time.monotonic() - start:4.1f}s  processed request {i}"))
for i in range(1, 9):
    print(f"submit request {i}: {'QUEUED' if qb.submit(i) else 'DROPPED (queue full)'}")
time.sleep(3.5)
qb.close()
