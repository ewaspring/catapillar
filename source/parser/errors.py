# parser/errors.py

class CatapillarError(Exception):
    """Base class for all Catapillar errors."""
    pass


class TokenizeError(CatapillarError):
    pass


class ParseError(CatapillarError):
    pass


class CatapillarWarning(Warning):
    pass
