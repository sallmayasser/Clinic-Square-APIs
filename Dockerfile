FROM node:slim

WORKDIR /app
COPY package*.json .
RUN npm install -g nodemon
RUN npm install .
COPY . .

EXPOSE 8001

CMD [ "npm" ,"run","dev"]