# /Dockerfile

FROM node:18

WORKDIR /usr/src/app

# Only copy the package.json and install dependencies to leverage Docker's cache
COPY 04-Application/backend/package*.json ./04-Application/backend/

# Run npm install with the correct prefix
RUN npm install --prefix ./04-Application/backend

# Copy the rest of the backend source code and all other project files
COPY 04-Application/backend/ ./04-Application/backend/

EXPOSE 3000

# Set the command to run the dev server from the correct directory
CMD ["npm", "run", "dev", "--prefix", "./04-Application/backend"]