# Mini Books API (Node.js + SQLite)

API mínima para gestionar libros. Un solo archivo (`server.js`), escucha en **puerto 8000**.

## Instalar y correr (Ubuntu/EC2)

```bash
sudo apt-get update
sudo apt-get install -y build-essential curl

# Instalar Node LTS con nvm
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts

# Descargar proyecto (sube el zip por scp o git clone tu repo)
unzip mini-books-api.zip -d ~/ && cd ~/mini-books-api
npm install
npm start
# -> Books API listening on http://0.0.0.0:8000
```

### Abrir puerto 8000
- En AWS EC2: Security Group -> Inbound rules -> agrega TCP 8000 (desde tu IP).
- (Opcional) UFW: `sudo ufw allow 8000/tcp`

## Endpoints
- `GET /health`
- `GET /books` (opcional `?q=` para buscar por título/autor)
- `GET /books/:id`
- `POST /books`  (JSON: `{ "title": "...", "author": "...", "year": 2021, "rating": 4.5 }`)
- `PUT /books/:id` (parcial)
- `DELETE /books/:id`

## Notas
- DB: `books.sqlite` se crea automáticamente y se llena con 5 libros demo si está vacía.
- Variables opcionales: `PORT` y `DB_PATH`.
