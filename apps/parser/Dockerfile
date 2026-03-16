FROM python:3.12-slim

RUN pip install --no-cache-dir uv

WORKDIR /workspace

COPY . .

RUN uv sync --project apps/parser --extra dev

ENV PYTHONPATH=/workspace/apps/parser/src

EXPOSE 8000

CMD ["uv", "run", "--project", "apps/parser", "uvicorn", "profilecore_parser.main:app", "--host", "0.0.0.0", "--port", "8000"]

