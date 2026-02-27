import yaml
import os

LEXICON = {}

def load_lexicon(path):
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    for intent_id, config in data.items():
        for alias in config.get("aliases", []):
            LEXICON[alias] = intent_id


def resolve_intent(word):
    return LEXICON.get(word)
