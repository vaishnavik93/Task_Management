# Task Management System

A full-stack Task Management Application built with **.NET 10 (Web API)** and **Angular (v17+)**.
Features a beautiful, responsive, glassmorphism-inspired UI and an Entity Framework In-Memory Database for rapid testing.

## Features
- **Frontend**: Angular standalone components, reactive forms, vibrant styling, animations. 
- **Backend**: Repository pattern, Service layer, EF Core In-Memory database, CORS enabled.
- **SSR**: There is a Server-Side Rendered (SSR) Razor view demonstrating task fetching directly from the backend services via MVC.

## Prerequisites
- .NET 10 SDK (or a compatible newer SDK)
- Node.js & npm
- Angular CLI (`npm install -g @angular/cli`)

## Getting Started

### 1. Run the Backend API
```powershell
cd Backend
dotnet run --urls="http://localhost:5000"
```
The API will be available at `http://localhost:5000/api/tasks`.

### 2. Run the Angular Frontend
```powershell
cd Frontend
npm install
ng serve -o
```
The application will open in your browser at `http://localhost:4200`.

### Troubleshooting
- **CORS Errors**: Ensure the backend is running correctly. The production deployment uses Kubernetes Ingress to route `/api` to the backend.
- **Missing Modules**: If the frontend fails to compile, try running `npm install` again.

