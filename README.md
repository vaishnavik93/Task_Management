# Team Task Management System

A production-ready full-stack Task Management System featuring Role-Based Access Control, Team Collaboration, JWT Authentication, and a sleek glassmorphic dashboard.

Built with **ASP.NET Core (Web API)** and **Angular (v17+)**. 

## Features
- **Authentication**: Secure Signup/Login using JWT Bearer Authentication and BCrypt password hashing.
- **Role-Based Access Control**:
  - `Admin`: Can create projects, add team members, and fully manage all tasks (Create, Read, Update, Delete).
  - `Member`: Can view assigned tasks, update their task status (Todo, In Progress, Completed), but cannot create or delete projects/tasks.
- **Team Management**: Admins can create projects and assign registered users to them as team members.
- **Task Management**: Tasks are linked to projects and assigned to specific team members. Members only see projects and tasks they are assigned to.
- **Dashboard**: A premium, glassmorphism-styled dashboard showing total tasks, in-progress, completed, and overdue metrics, with a dynamic completion progress bar.
- **Backend Architecture**: Repository pattern, Service layer, SQLite database using Entity Framework Core with optimized relational schemas.
- **Docker & Railway Deployment**: Fully dockerized with a multi-stage Dockerfile designed for instant deployment on Railway as a unified full-stack service.

## Tech Stack
- **Backend**: ASP.NET Core 8.0, Entity Framework Core 8.0, SQLite, JWT Authentication.
- **Frontend**: Angular 17+ (Standalone Components), Signals, Reactive Forms, RxJS, Custom Glassmorphic CSS.
- **Containerization**: Docker (multi-stage build compiling both Frontend and Backend into a single image).

## Running Locally

### Prerequisites
- .NET 8.0+ SDK
- Node.js (v20+) & npm
- Angular CLI

### 1. Start the Backend API
```powershell
cd Backend
dotnet run --urls="http://localhost:5000"
```
The SQLite database (`taskmanager.db`) will be automatically created and migrated on first startup.

### 2. Start the Angular Frontend
In a new terminal:
```powershell
cd Frontend
npm install
npm run start
```
The application will be available at `http://localhost:4200/`. (The development server proxies `/api` requests to the backend automatically).

## Deployment

### Railway (Recommended)
This repository is configured to deploy as a unified full-stack application on Railway.

1. Connect your GitHub repository to a new Railway project.
2. Railway will automatically detect the root `Dockerfile` and build both the Angular app and ASP.NET API.
3. The built Angular static files will be served by the ASP.NET Core application from the `wwwroot` folder.
4. No extra database plugin is strictly required, as it uses an embedded SQLite database (note: SQLite data will be ephemeral on serverless platforms unless you attach a persistent volume in Railway, which is recommended for production).

Enjoy managing your tasks! ✨
