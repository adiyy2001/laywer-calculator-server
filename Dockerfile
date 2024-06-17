# Use Puppeteer image version 19.7.2 as base image
FROM ghcr.io/puppeteer/puppeteer:19.7.2

# Set environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Change ownership to non-root user
RUN chown -R pptruser:pptruser /usr/src/app

# Switch to pptruser to run npm install
USER pptruser

# Install dependencies
RUN npm install --only=prod

# Copy the rest of the application code
COPY . .

# Build TypeScript
RUN npm run build

# Expose necessary ports if needed
# EXPOSE 3000

# Command to run the application
CMD [ "npm", "start" ]
