# 🚨 VULNERABILITY 4: Outdated Base Image (Caught by Trivy Image Scan)
FROM node:14-alpine 

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# 🚨 VULNERABILITY 5: Running as Root (Caught by Trivy / ZAP)
# Best practice is to use "USER node", but we left it out intentionally.

EXPOSE 8002
CMD ["node", "index.js"]
