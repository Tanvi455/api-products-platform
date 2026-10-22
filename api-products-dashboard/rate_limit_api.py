
from flask import Flask, jsonify, request
from flask_cors import CORS
import importlib.util
import os
import time

app = Flask(__name__)
CORS(app)

# Load the original Q3 implementation without modifying it.
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIMITER_FILE = os.path.join(
    PROJECT_ROOT, "Q3_Rate_Limiters", "rate_limiters.py"
)

spec = importlib.util.spec_from_file_location("q3_rate_limiters", LIMITER_FILE)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Cannot load limiter module: {LIMITER_FILE}")

limiters = importlib.util.module_from_spec(spec)
spec.loader.exec_module(limiters)

# Keep independent limiter instances for the dashboard demo.
token_bucket = limiters.TokenBucket(capacity=5, rate=1)
leaky_bucket = limiters.LeakyBucket(capacity=5, rate=1)

queue_results = []
queue_bucket = limiters.QueueLeakyBucket(
    capacity=5,
    rate=2,
    handler=lambda item: queue_results.append(item)
)

@app.get("/health")
def health():
    return jsonify({"status": "UP", "service": "APIFORGE Rate Limit API"})

@app.post("/api/limit")
def check_limit():
    data = request.get_json(silent=True) or {}
    algorithm = data.get("algorithm", "token")
    amount = data.get("amount", 1)

    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError("Amount must be positive")
    except (TypeError, ValueError):
        return jsonify({"error": "Amount must be a positive number"}), 400

    if algorithm == "token":
        allowed = token_bucket.allow(amount)
    elif algorithm == "leaky":
        allowed = leaky_bucket.allow(amount)
    elif algorithm == "queue":
        allowed = queue_bucket.submit({
            "amount": amount,
            "submitted_at": time.time()
        })
    else:
        return jsonify({"error": "Use token, leaky, or queue"}), 400

    return jsonify({
        "algorithm": algorithm,
        "allowed": allowed,
        "result": "Accepted" if allowed else "Rejected",
        "timestamp": time.time()
    })

@app.get("/api/limit/status")
def limit_status():
    return jsonify({
        "algorithms": ["token", "leaky", "queue"],
        "configuration": {
            "token_capacity": 5,
            "token_refill_rate_per_second": 1,
            "leaky_capacity": 5,
            "leaky_rate_per_second": 1,
            "queue_capacity": 5,
            "queue_processing_rate_per_second": 2
        },
        "processed_queue_items": len(queue_results)
    })

if __name__ == "__main__":
    try:
        app.run(host="127.0.0.1", port=5002, debug=False)
    finally:
        queue_bucket.close()
