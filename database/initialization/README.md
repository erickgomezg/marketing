# Inicialización de base de datos

El servicio de una sola ejecución `database-init` espera a que SQL Server acepte conexiones y crea de forma idempotente `AI_MARKETING_MANAGER`, el login `app_user` y su usuario dentro de la base. No crea tablas ni procedimientos de negocio. `sa` se usa solo durante el bootstrap; la API utiliza el login de aplicación.

La secuencia SQL está acotada a este bootstrap de infraestructura. Toda operación relacional futura de negocio debe ejecutarse mediante Stored Procedures desde Infrastructure.
