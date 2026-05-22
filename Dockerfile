# We skip the Angular build stage entirely because the free tier of Railway 
# runs out of memory (500MB limit) during 'npm ci'.
# Instead, we rely on the pre-built 'dist' folder committed to the repository!

# Stage 1: Build ASP.NET Core Backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-backend
WORKDIR /app/backend

# Copy the csproj file and restore dependencies
COPY Backend/*.csproj ./
RUN dotnet restore

# Copy the rest of the backend source code
COPY Backend/ ./
# Publish the application
RUN dotnet publish -c Release -o /out

# Stage 2: Combine and Run
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Copy the published backend
COPY --from=build-backend /out ./

# Copy the pre-built frontend from the repository directly into the wwwroot folder
COPY Frontend/dist/Frontend/browser ./wwwroot

# Set port and start the application
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV CorsOrigins=http://localhost:4200

ENTRYPOINT ["dotnet", "Backend.dll"]
