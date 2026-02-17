# runtime/nodes.py

CAPABILITIES = {}

def capability(intent_id):
    def deco(fn):
        CAPABILITIES[intent_id] = fn
        return fn
    return deco
