# Stage 1: Build Angular Frontend
FROM node:20-alpine AS build-frontend
WORKDIR /app/frontend

# Copy package files and install dependencies
COPY Frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend source code and build it
COPY Frontend/ ./
RUN npm run build -- --configuration production

# Stage 2: Build ASP.NET Core Backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-backend
WORKDIR /app/backend

# Copy the csproj file and restore dependencies
COPY Backend/*.csproj ./
RUN dotnet restore

# Copy the rest of the backend source code
COPY Backend/ ./
# Publish the application
RUN dotnet publish -c Release -o /out

# Stage 3: Combine and Run
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Copy the published backend
COPY --from=build-backend /out ./

# Copy the built frontend into the wwwroot folder
# Angular 17+ outputs to dist/<project-name>/browser
COPY --from=build-frontend /app/frontend/dist/Frontend/browser ./wwwroot

# Set port and start the application
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV CorsOrigins=http://localhost:4200

ENTRYPOINT ["dotnet", "Backend.dll"]
