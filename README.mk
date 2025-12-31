# 🎓 დედაენა (Dedaena)

ვებსაიტი **დედაენა** წარმოადგენს იაკობ გოგებაშვილის დედაენაზე დაფუძნებულ საგანმანათლებლო პლატფორმას, რომელიც მომხმარებლებს საშუალებას აძლევს შეისწავლონ ქართული ენა ინტერაქტიული თამაშების საშუალებით.

პროექტი იყენებს თანამედროვე ვებტექნოლოგიებს და შედგება ორი ძირითადი ნაწილისგან: **Backend (FastAPI)** და **Frontend (React)**.

---

## 📋 სისტემის მოთხოვნები

- **Python** 3.10+
- **Node.js** 18+
- **PostgreSQL** 12+
- **Git**

---

## 🚀 სწრაფი დაწყება

### 1. Repository-ის კლონირება

```bash
git clone https://github.com/your-username/dedaena.git
cd dedaena
```

### 2. PostgreSQL Database შექმნა

```bash
# PostgreSQL-ში შესვლა
psql -U postgres

# Database შექმნა
CREATE DATABASE dedaena_db;

# Tables შექმნა (schema-ს ინსტრუქციები იხილეთ ქვემოთ)
```

**⚠️ მნიშვნელოვანი:** SQL dump ფაილი არ არის repository-ში უსაფრთხოების მიზნით. Tables-ები უნდა შექმნათ ხელით ან migration script-ებით.

### 3. Backend Setup

```bash
cd backend

# Virtual environment შექმნა
python3 -m venv venv
source venv/bin/activate  # Windows-ზე: venv\Scripts\activate

# Dependencies დაყენება
pip install -r requirements.txt

# .env ფაილის შექმნა
cp .env.example .env  # ან შექმენი ხელით
```

**Backend `.env` ფაილის შინაარსი:**

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=dedaena_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password_here

# JWT Secret - MUST BE CHANGED!
SECRET_KEY=GENERATE_NEW_SECRET_KEY_HERE
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Application
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000
```

**🔐 SECRET_KEY გენერაცია:**

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

დააკოპირე გენერირებული string და ჩასვი `.env` ფაილში `SECRET_KEY=` ველში.

**Backend გაშვება:**

```bash
python run.py
```

API ხელმისაწვდომია: `http://localhost:8000`  
Swagger Docs: `http://localhost:8000/api/docs`

### 4. Frontend Setup

```bash
cd frontend

# Dependencies დაყენება
npm install

# .env ფაილის შექმნა
echo "REACT_APP_API_URL=http://localhost:8000/api" > .env
echo "REACT_APP_DEBUG=true" >> .env
```

**Frontend გაშვება:**

```bash
npm start
```

აპლიკაცია გაიხსნება: `http://localhost:3000`

---

## 🐳 Docker Setup

```bash
# ყველა სერვისის გაშვება (backend + frontend + postgres)
docker-compose up --build

# Background-ში გაშვება
docker-compose up -d

# გაჩერება
docker-compose down
```

---

## 📚 Database Schema

**ძირითადი ცხრილები:**

- `users` - მომხმარებლები (admin, moderator, user roles)
- `letters` - ქართული ასოები
- `words` - სიტყვები
- `sentences` - წინადადებები
- `proverbs` - ანდაზები
- `toreads` - კითხვის ტექსტები

**Migration-ები:**

Database schema განახლება მოხდება migration scripts-ის საშუალებით (განვითარების პროცესში).

---

## 🔑 Admin/Moderator User შექმნა

პირველი admin მომხმარებლის შესაქმნელად:

```bash
# Backend folder-ში
python -c "from app.core.security import get_password_hash; print(get_password_hash('your_password'))"
```

შემდეგ PostgreSQL-ში:

```sql
INSERT INTO users (username, email, password, is_admin, is_active)
VALUES ('admin', 'admin@example.com', 'hashed_password_here', true, true);
```

---

## 🛠️ ტექნოლოგიები

### Backend
- **FastAPI** - თანამედროვე Python web framework
- **PostgreSQL** - relational database
- **psycopg2** - PostgreSQL adapter
- **JWT** - authentication
- **bcrypt** - password hashing

### Frontend
- **React** - UI library
- **React Router** - navigation
- **Axios** - HTTP client
- **SCSS** - styling

---

## 📁 პროექტის სტრუქტურა

```
dedaena/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Security, utilities
│   │   ├── schemas/      # Pydantic models
│   │   └── main.py       # FastAPI app
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── App.jsx
│   └── package.json
└── docker-compose.yml
```

---

## ⚠️ უსაფრთხოება

**გამოქვეყნებამდე დარწმუნდი:**

- ✅ `.env` ფაილი `.gitignore`-შია და არ ატვირთავ GitHub-ზე
- ✅ `SECRET_KEY` გენერირებულია ძლიერი (64+ chars)
- ✅ Production-ში სხვა database credentials გამოიყენე
- ✅ `DEBUG=False` production-ში
- ✅ SQL dump-ში არ ატვირთო რეალური user emails/passwords

---

## 🤝 წვლილის შეტანა

Pull requests მისაღებია! დიდი ცვლილებებისთვის გთხოვთ პირველ რიგში გახსნათ issue რომ განიხილოთ რა გინდათ შეცვალოთ.

---

## 📄 ლიცენზია

[MIT](LICENSE)

---

## 👨‍💻 ავტორი

**Luka** - [GitHub](https://github.com/your-username)

---

## 📞 კონტაქტი

კითხვების შემთხვევაში შეგიძლიათ დაუკავშირდეთ...

---

## 🎯 მიზანი

პროექტი მიზნად ისახავს ქართული ენის შესწავლის პროცესის გამარტივებასა და ინტერაქტიულობის გაზრდას თანამედროვე ვებტექნოლოგიების გამოყენებით.

