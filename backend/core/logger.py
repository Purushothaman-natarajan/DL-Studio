import logging
import sys
from collections import deque

# Global log queue for SSE
log_queue = deque(maxlen=100)

class QueueHandler(logging.Handler):
    def emit(self, record):
        log_entry = self.format(record)
        log_queue.append(log_entry)

# Standard logger setup
def get_logger(name: str):
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        
        # Simple console handler
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        # SSE Queue handler
        q_handler = QueueHandler()
        q_handler.setFormatter(formatter)
        logger.addHandler(q_handler)
        
    return logger

# Global default logger
logger = get_logger("DL-Studio")
