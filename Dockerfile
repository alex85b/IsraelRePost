# Specify a base image: alpine minimal image.
FROM node:14-alpine

# a working directory inside the container
#   if it doesn't exists, it will be created.
WORKDIR  /app

# copy only the 'package.json' file to the workdir inside the container
#   this is use to perform 'npm install'.
COPY ./package.json ./

#Install some dependencies.
RUN npm install

# Copy everything from the build context to
#   the current workdir in the container.
COPY ./ ./

# Default command
CMD ["npm", "start"]