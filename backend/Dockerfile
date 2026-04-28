FROM python:3.11

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p pdfs pdf_images

EXPOSE 5000

ENV FLASK_APP=server.py
ENV FLASK_ENV=production

CMD ["python", "server.py"]