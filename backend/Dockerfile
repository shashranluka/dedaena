# 1. გამოიყენე official Python image
FROM python:3.11-slim

# 2. სამუშაო დირექტორია
WORKDIR /app

# 3. დააკოპირე დამოკიდებულებები
COPY requirements.txt .

# 4. დააინსტალირე დამოკიდებულებები
RUN pip install --no-cache-dir -r requirements.txt

# 5. დააკოპირე აპლიკაციის კოდი
COPY . .

# 6. დააყენე გარემოს ცვლადები (სურვილისამებრ)
ENV PYTHONUNBUFFERED=1

# 7. Default port (FastAPI-სთვის)
EXPOSE 8000

# 8. გაუშვი FastAPI (uvicorn)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]