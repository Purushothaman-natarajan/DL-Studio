import logging
import sys
from collections import deque
from functools import wraps

from core.config import get_run_log_path

LOG_FORMAT = "%(asctime)s - %(run_id)s - %(name)s - %(levelname)s - %(message)s"
LOG_DATEFMT = "%Y-%m-%d %H:%M:%S"
DEFAULT_RUN_CONTEXT = "system"
BASE_FORMATTER = logging.Formatter(LOG_FORMAT, datefmt=LOG_DATEFMT)

# Global log queue for SSE
log_queue = deque(maxlen=100)

class DefaultRunContextFilter(logging.Filter):
    def filter(self, record):
        if not getattr(record, "run_id", None):
            record.run_id = DEFAULT_RUN_CONTEXT
        return True

class RunContextFilter(logging.Filter):
    def __init__(self, run_id: str):
        super().__init__()
        self.run_id = run_id

    def filter(self, record):
        record.run_id = self.run_id
        return True

class QueueHandler(logging.Handler):
    def emit(self, record):
        log_entry = self.format(record)
        log_queue.append(log_entry)

def get_logger(name: str):
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        logger.addFilter(DefaultRunContextFilter())

        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(BASE_FORMATTER)
        logger.addHandler(handler)

        q_handler = QueueHandler()
        q_handler.setFormatter(BASE_FORMATTER)
        logger.addHandler(q_handler)

    return logger

logger = get_logger("DL-Studio")

def attach_run_file_handler(run_id: str):
    log_path = get_run_log_path(run_id)
    handler = logging.FileHandler(str(log_path), encoding="utf-8")
    handler.setFormatter(BASE_FORMATTER)
    handler.addFilter(RunContextFilter(run_id))
    logger.addHandler(handler)
    return handler

def detach_run_file_handler(handler: logging.Handler):
    logger.removeHandler(handler)
    handler.close()


def run_log_context(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        run_id = None
        if args:
            run_id = getattr(args[0], "run_id", None)
        handler = None

        if run_id:
            try:
                handler = attach_run_file_handler(run_id)
            except Exception as exc:
                logger.warning(f"Unable to attach run log handler: {exc}")

        try:
            return func(*args, **kwargs)
        finally:
            if handler:
                detach_run_file_handler(handler)

    return wrapper
