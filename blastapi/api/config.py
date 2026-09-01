import os


def load_env_file(path=None):
    """Load KEY=VALUE pairs from a .env file into the environment.

    Written against the standard library so the project keeps its three
    dependencies. Values already set in the real environment win, which is
    what deployment platforms (Render, Railway, Fly) expect — they inject
    variables directly and no .env file is present there.

    Returns the list of names it set, for logging.
    """
    if path is None:
        path = os.path.join(os.path.dirname(__file__), "..", ".env")
    path = os.path.abspath(path)
    if not os.path.isfile(path):
        return []

    loaded = []
    with open(path, encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and value and key not in os.environ:
                os.environ[key] = value
                loaded.append(key)
    return loaded
