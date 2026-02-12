# ast/nodes.py

class Arrow:
    def __init__(self, from_, to_, state=None):
        self.from_ = from_
        self.to_ = to_
        self.state = state
