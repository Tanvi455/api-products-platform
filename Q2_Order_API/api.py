from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Order Management API")

orders = {}
next_id = 1


class OrderInput(BaseModel):
    item: str = Field(min_length=1)
    quantity: int = Field(gt=0)


@app.post("/orders", status_code=201)
def create_order(body: OrderInput):
    global next_id

    item = body.item.strip()
    if not item:
        raise HTTPException(status_code=400, detail="item must not be empty")

    order = {
        "id": next_id,
        "item": item,
        "quantity": body.quantity,
        "status": "created",
    }
    orders[next_id] = order
    next_id += 1
    return order


@app.get("/orders/{order_id}")
def get_order(order_id: int):
    if order_id not in orders:
        raise HTTPException(
            status_code=404, detail=f"Order {order_id} not found"
        )
    return orders[order_id]


@app.get("/orders")
def list_orders():
    return list(orders.values())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5001)
