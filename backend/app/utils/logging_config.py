import logging
import os
from logging.handlers import RotatingFileHandler
from pythonjsonlogger import jsonlogger
from app.config import settings

def setup_logging():
    os.makedirs(os.path.dirname(settings.LOG_PATH), exist_ok=True)
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    file_handler = RotatingFileHandler(settings.LOG_PATH, maxBytes=5*1024*1024, backupCount=3)
    formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    console_handler = logging.StreamHandler()
    console_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    return logger

logger = setup_logging()
