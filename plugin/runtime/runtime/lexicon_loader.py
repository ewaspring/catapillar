import json
import os

LEXICON = {}

def _load_lexicon_data(path):
    """Load lexicon from .yaml (if pyyaml available) or fallback to .json (no extra deps)."""
    try:
        import yaml
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)
    except ImportError:
        json_path = path.replace(".yaml", ".json") if path.endswith(".yaml") else path + ".json"
        if os.path.isfile(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                return json.load(f)
        raise

def load_lexicon(path):
    data = _load_lexicon_data(path)
    for intent_id, config in data.items():
        for alias in config.get("aliases", []):
            LEXICON[alias] = intent_id


def resolve_intent(word):
    return LEXICON.get(word)
