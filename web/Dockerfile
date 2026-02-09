# Pulling the base image for building the application
FROM node:20-alpine AS build

# Creating a working directory inside the container
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Copying the dependency list
COPY package*.json ./

# Installing dependencies
RUN npm ci

# Copying the application source code into the container
COPY . .

# Build application
RUN npm run build

# Exposing the port that the application will run on
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
