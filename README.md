# AttendanceAI
## Overview

__AttendanceAI__ is a prototype application designed to streamline attendance management using modern web technologies and AI-driven features. The project is structured with a client–server architecture and shared modules, making it scalable and easy to maintain.

The repository demonstrates:

- A __TypeScript-based frontend__ powered by Vite and TailwindCSS.
- A __[Node.js/Express](https://Node.js/Express) backend__ with database configuration (Drizzle ORM).
- Shared utilities and scripts for deployment and automation.

## Project Structure
```bash
AttendanceAI/
├── client/        # Frontend application (React + Vite + TailwindCSS)
├── server/        # Backend services (Node.js + Express + Drizzle ORM)
├── shared/        # Shared modules and utilities
├── script/        # Deployment and automation scripts
├── .env           # Environment variables
└── package.json   # Project dependencies and scripts
```

## Features
- 📊 __AI-powered attendance tracking__ (prototype stage).
- ⚡ __Fast frontend development__ with Vite and TailwindCSS.
-  🗄️ __Database integration__ using Drizzle ORM.
- 🔄 __Reusable shared modules__ for consistency across client and server.
- 🛠️ __Configurable environment__ via `.env` file.

## Installation
### Prerequisites
- [Node.js](https://Node.js) (v18 or higher recommended)
- npm or yarn package manager
- A configured database (MySQL or compatible with Drizzle ORM)

### Steps
```bash
# Clone the repository
git clone https://github.com/Juannnns/AttendanceAI.git
cd AttendanceAI

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database and server settings

# Run the development server
npm run 
```

## Usage 
- __Frontend:__ Navigate to `http://127.0.0.1:5000`
- __Backend:__ API runs on `http://localhost:5000` (configurable in `.env`).
- __Scripts:__ Use the `script/` folder for automation task.

## Contributing
Contributions are welcome!

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -m "Add feature"`).
4. Push to your branch (`git push origin feature-name`).
5. Open a Pull Request. 

## License
This project is currently under development and does not specify a license. Please contact the repository owner before using it in production.

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# AttendanceAI
## Descripción General
__AttendanceAI__ es una aplicación prototipo diseñada para optimizar la gestión de asistencia utilizando tecnologías web modernas y características impulsadas por inteligencia artificial. El proyecto está estructurado con una arquitectura cliente–servidor y módulos compartidos, lo que lo hace escalable y fácil de mantener.

El repositorio incluye:

 - Un __frontend en TypeScript__ basado en Vite y TailwindCSS.
 - Un __backend en [Node.js/Express](https://Node.js/Express)__ con configuración de base de datos mediante Drizzle ORM.
 - Utilidades y scripts compartidos para despliegue y automatización.

 ## Estructura del Proyecto

 ```bash
 AttendanceAI/
├── client/        # Aplicación frontend (React + Vite + TailwindCSS)
├── server/        # Servicios backend (Node.js + Express + Drizzle ORM)
├── shared/        # Módulos y utilidades compartidas
├── script/        # Scripts de despliegue y automatización
├── .env           # Variables de entorno
└── package.json   # Dependencias y scripts del proyecto
 ```

 ## Características 
 - 📊 __Seguimiento de asistencia con IA__ (fase prototipo).
 - ⚡ __Desarrollo frontend rápido__ con Vite y TailwindCSS.
 - 🗄️ __Integración con base de datos__ usando Drizzle ORM.
 - 🔄 __Módulos compartidos reutilizables__ para consistencia entre cliente y servidor.
 - 🛠️ __Configuración flexible__ mediante archivo `.env`.

 ## Instalación 
 ### Requisitos previos
 - [Node.js](https://Node.js) (v18 o superior recomendado)
 - npm o yarn como gestor de paquetes
 - Una base de datos configurada (MySQL o compatible con Drizzle ORM)

 ### Pasos 
```bash
# Clonar el repositorio
git clone https://github.com/Juannnns/AttendanceAI.git
cd AttendanceAI

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la configuración de tu base de datos y servidor

# Ejecutar el servidor de desarrollo
npm run dev
```

## Uso 
- __Frontend:__ Navegar a `http://127.0.0.1:5000`.
- __Backend:__ La API corre en `http://localhost:5000` (configurable en .env).
- __Scripts:__ Utilizar la carpeta `script/` para tareas de automatización.

## Contribuciones
¡Las contribuciones son bienvenidas!

1. Haz un fork del repositorio.
2. Crea una nueva rama (`git checkout -b nombre-de-feature`).
3. Realiza tus cambios y haz commit (`git commit -m "Agregar feature"`).
4. Haz push a tu rama (`git push origin nombre-de-feature`).
5. Abre un Pull Request. 

## Licencia 
Este proyecto está en desarrollo y actualmente no especifica una licencia. Por favor, contacta al propietario del repositorio antes de usarlo en producción.
