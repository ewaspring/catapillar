from runtime.nodes import CAPABILITIES
from runtime.router import Router

router = Router()

def run_flow(flow, ctx):
    current = flow[0]

    visited = set()

    while current:

        if current in visited:
            print("Loop detected. Stopping.")
            break
        visited.add(current)

        node_fn = CAPABILITIES.get(current)

        if not node_fn:
            raise RuntimeError(f"No capability for {current}")

        result = node_fn(ctx)
        if isinstance(result, dict):
            ctx.update(result)

        # 只由 Router 决定下一步
        current = router.route(current, ctx)
