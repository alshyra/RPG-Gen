FROM node:25-alpine

COPY . /app
WORKDIR /app

RUN npm install
RUN cd backend && npm install
RUN cd frontend && npm install

CMD ["sh", "-c", "cd backend && npm start & cd frontend && npm run dev"]
