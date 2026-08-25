# restaurante-medium

Aplicación web para gestión de un restaurante: mesas, platos, presas y pedidos con su detalle.

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Prisma ORM** conectado a **MySQL** (pensado para correr sobre **XAMPP**)

## 1. Requisitos previos

- Node.js 18 o superior
- XAMPP con el módulo MySQL (MariaDB) corriendo

## 2. Crear la base de datos

1. Abrí XAMPP y arrancá **Apache** y **MySQL**.
2. Entrá a phpMyAdmin (`http://localhost/phpmyadmin`).
3. Creá una base de datos nueva llamada exactamente **`restaurante-medium`** (cotejamiento `utf8mb4_general_ci` está bien).

No hace falta crear tablas a mano: Prisma las genera por vos en el paso 4.

## 3. Instalar dependencias

En la raíz del proyecto:

```bash
npm install
```

## 4. Configurar la conexión

Copiá `.env.example` a `.env` (si no existe ya) y ajustá usuario/contraseña de tu MySQL de XAMPP:

```bash
cp .env.example .env
```

Por defecto XAMPP usa el usuario `root` sin contraseña:

```
DATABASE_URL="mysql://root:@localhost:3306/restaurante-medium"
```

Si tu MySQL usa otro puerto (ej. 3307) o tiene contraseña, ajustá esta línea:

```
DATABASE_URL="mysql://usuario:password@localhost:PUERTO/restaurante-medium"
```

## 5. Generar el cliente de Prisma y crear las tablas

```bash
npx prisma generate
npx prisma db push
```

`prisma db push` lee `prisma/schema.prisma` y crea las tablas `Mesas`, `Platos`, `Presas`, `plato_presa`, `Pedidos` y `Detalle_Pedido` directamente en tu base `restaurante-medium`, respetando las relaciones y llaves foráneas definidas.

Si más adelante cambiás el schema, volvé a correr `npx prisma db push` (o migrá con `npx prisma migrate dev` si preferís versionar los cambios).

## 6. Levantar la app

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Estructura del proyecto

```
prisma/schema.prisma        Modelos de datos (Mesa, Plato, Presa, PlatoPresa, Pedido, DetallePedido)
src/lib/prisma.ts           Cliente Prisma singleton
src/lib/api.ts               Helpers de respuestas HTTP para las API routes
src/lib/client.ts            Helper de fetch para el frontend
src/types/index.ts           Tipos TypeScript compartidos
src/app/api/**               API routes (CRUD REST) para cada entidad
src/app/mesas                CRUD de Mesas
src/app/platos               CRUD de Platos (con asignación de presas)
src/app/presas               CRUD de Presas
src/app/pedidos              Listado + creación de Pedidos
src/app/pedidos/[id]         Detalle de un pedido: agregar/quitar ítems, cambiar estado
```

## Endpoints disponibles

| Recurso              | Endpoints                                                                 |
|-----------------------|---------------------------------------------------------------------------|
| Mesas                | `GET/POST /api/mesas`, `GET/PUT/DELETE /api/mesas/:id`                    |
| Platos               | `GET/POST /api/platos`, `GET/PUT/DELETE /api/platos/:id`                  |
| Presas               | `GET/POST /api/presas`, `GET/PUT/DELETE /api/presas/:id`                  |
| Relación Plato-Presa | `GET/POST /api/plato-presa`, `DELETE /api/plato-presa/:id`                |
| Pedidos              | `GET/POST /api/pedidos`, `GET/PUT/DELETE /api/pedidos/:id`                |
| Ítems del pedido     | `GET/POST /api/pedidos/:id/detalles`, `PUT/DELETE /api/detalles/:id`      |

## Reglas de negocio implementadas

- Al **crear un pedido** se crea vacío (total `0.00`) y se le va agregando el detalle.
- Al **agregar un ítem** a un pedido: se valida stock disponible del plato, se calcula el `subtotal` (`precio × cantidad`), se descuenta el stock del plato y se suma al `total` del pedido — todo en una transacción.
- Al **editar la cantidad** de un ítem: se ajusta el stock por la diferencia y se recalcula el total del pedido.
- Al **eliminar un ítem** o **eliminar un pedido completo**: se devuelve el stock reservado al plato correspondiente.
- El campo `estado` del pedido acepta: `pendiente`, `en_preparacion`, `entregado`, `cancelado`.

## Notas

- Este proyecto fue generado sin poder ejecutar `npx prisma generate` ni conectarse a una base de datos real, porque el entorno donde se generó no tiene salida de red hacia `binaries.prisma.sh` ni a tu MySQL local. Por eso el paso 5 es obligatorio antes de levantar la app.
