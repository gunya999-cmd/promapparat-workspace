FROM node:20-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN mkdir -p /app/storage
ENV NODE_ENV=production
EXPOSE 8787
CMD ["sh","-c","npm run migrate && if [ \"$SEED_ON_START\" = \"true\" ]; then npm run seed; fi && npm start"]
