import queue
import threading
import time
from typing import Callable


class TokenBucket:
    """Allows bursts up to `capacity`; tokens refill continuously at `rate` per second."""

    def __init__(self, capacity: float, rate: float, clock: Callable[[], float] = time.monotonic):
        if capacity <= 0 or rate <= 0:
            raise ValueError("capacity and rate must be positive")
        self.capacity = capacity
        self.rate = rate
        self._clock = clock
        self._tokens = float(capacity)
        self._last = clock()
        self._lock = threading.Lock()

    def _refill(self) -> None:
        now = self._clock()
        self._tokens = min(self.capacity, self._tokens + (now - self._last) * self.rate)
        self._last = now

    def allow(self, tokens: float = 1) -> bool:
        with self._lock:
            self._refill()
            if self._tokens >= tokens:
                self._tokens -= tokens
                return True
            return False


class LeakyBucket:
    """Meter-style leaky bucket: each request adds water; it leaks at `rate` per second.
    Requests that would overflow `capacity` are rejected, smoothing output to `rate`."""

    def __init__(self, capacity: float, rate: float, clock: Callable[[], float] = time.monotonic):
        if capacity <= 0 or rate <= 0:
            raise ValueError("capacity and rate must be positive")
        self.capacity = capacity
        self.rate = rate
        self._clock = clock
        self._level = 0.0
        self._last = clock()
        self._lock = threading.Lock()

    def _leak(self) -> None:
        now = self._clock()
        self._level = max(0.0, self._level - (now - self._last) * self.rate)
        self._last = now

    def allow(self, amount: float = 1) -> bool:
        with self._lock:
            self._leak()
            if self._level + amount <= self.capacity:
                self._level += amount
                return True
            return False


class QueueLeakyBucket:
    """Queue-style leaky bucket: requests wait in a FIFO queue of size `capacity`
    and a worker thread processes one every 1/`rate` seconds. `submit` returns
    False when the queue is full (overflow)."""

    def __init__(self, capacity: int, rate: float, handler: Callable[[object], None]):
        if capacity <= 0 or rate <= 0:
            raise ValueError("capacity and rate must be positive")
        self._queue: queue.Queue = queue.Queue(maxsize=capacity)
        self._interval = 1.0 / rate
        self._handler = handler
        self._stop = threading.Event()
        self._worker = threading.Thread(target=self._run, daemon=True)
        self._worker.start()

    def submit(self, item) -> bool:
        try:
            self._queue.put_nowait(item)
            return True
        except queue.Full:
            return False

    def _run(self) -> None:
        next_at = time.monotonic()
        while not self._stop.is_set():
            try:
                item = self._queue.get(timeout=0.05)
            except queue.Empty:
                next_at = time.monotonic()  # idle: don't bank leak credit
                continue
            delay = next_at - time.monotonic()
            if delay > 0:
                self._stop.wait(delay)
            self._handler(item)
            next_at = max(next_at, time.monotonic() - self._interval) + self._interval

    def close(self) -> None:
        self._stop.set()
        self._worker.join()


if __name__ == "__main__":
    t = [0.0]
    clock = lambda: t[0]

    tb = TokenBucket(capacity=5, rate=1, clock=clock)
    assert [tb.allow() for _ in range(6)] == [True] * 5 + [False]  # burst then reject
    t[0] += 2
    assert [tb.allow() for _ in range(3)] == [True, True, False]  # 2 tokens refilled

    lb = LeakyBucket(capacity=3, rate=1, clock=clock)
    assert [lb.allow() for _ in range(4)] == [True] * 3 + [False]  # fills then overflows
    t[0] += 1
    assert lb.allow() and not lb.allow()  # one unit leaked
    done = []
    qb = QueueLeakyBucket(capacity=3, rate=20, handler=done.append)
    accepted = [qb.submit(i) for i in range(10)]
    assert accepted.count(True) >= 3 and not all(accepted)  # overflow rejected
    time.sleep(0.5)
    qb.close()
    assert done == [i for i, ok in enumerate(accepted) if ok]  # FIFO, all drained
    print("ok")
