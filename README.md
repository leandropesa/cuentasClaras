# CuentasClaras

<p align="center">
  <img src="./front/src/styles/logoRepo.png" alt="Logo de CuentasClaras" width="180"/>
</p>
Trabajo Práctico · Gestión del Desarrollo de Sistemas Informáticos (GDSI) · FIUBA

**CuentasClaras** es una aplicación web que le permite a un consorcio o a una casa compartida llevar sus finanzas *sin administrador profesional*: cualquier socio puede cargar gastos, y el sistema los distribuye, calcula balances individuales y controla pagos y mora de forma transparente.

---

## Tabla de contenidos

- [Demo](#demo)
- [Descripción](#descripción)
- [Equipo](#equipo)
- [Links del proyecto](#links-del-proyecto)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Features de la v3](#features-de-la-v3)
- [Puesta en marcha](#puesta-en-marcha)
  - [Requisitos previos](#requisitos-previos)
  - [1. Base de datos (Docker)](#1-base-de-datos-docker)
  - [2. Backend](#2-backend)
  - [3. Frontend](#3-frontend)
  - [Usuarios de prueba](#usuarios-de-prueba)
  - [Variables de entorno](#variables-de-entorno)
- [API — Endpoints principales](#api--endpoints-principales)
- [Tests](#tests)
- [Gestión del proyecto](#gestión-del-proyecto)
- [Créditos](#créditos)

---

## Demo

🎥 **Video demostrativo:** https://drive.google.com/file/d/1kSb7EWbxCZqqbbFJNiudmGy8_cmb0Es-/view?usp=sharing

---

## Descripción

**CuentasClaras** es una aplicación web para la gestión autogestionada de gastos comunes en consorcios de propiedad horizontal y casas familiares. Su propuesta central es eliminar la figura del administrador profesional: son los propios socios quienes registran, distribuyen y controlan los gastos de forma transparente y colaborativa.

La v3 incorpora el modelo de **Casa Familiar** como tipo de grupo diferenciado (US-02), **invitaciones por código** para usuarios no registrados (US-03) (se descartó el envío por email porque Google bloqueaba los correos desde IPs de otros dispositivos), **división proporcional de gastos fijos** según peso (m²) (US-05/US-06), **validación de comprobantes** con persistencia de archivos (US-11), **gestión automatizada de mora** (US-07) y la **estabilización de la gestión de miembros** con promoción, degradación y expulsión (US-12).

---

## Equipo

| Padron | Integrante |
|-----|-----------|
| 110075 | Estefano Polizzi |
| 110076 | Leandro Pesa |
| 105876 | Ramiro Mineldin |
| 111148 | Nicolas Cardone |
| 111537 | Valentin Marcos Provost |
| 111605 | Enrique José Heller |


---

## Links del Proyecto

| Recurso | Link |
|---------|------|
| Mural del proyecto | https://app.mural.co/t/kleerjg1868/m/kleerjg1868/1774792278774/4846e4caba4ac7a0f4523d36f858c18cf8ffca71 |
| Video demo | https://drive.google.com/file/d/1kSb7EWbxCZqqbbFJNiudmGy8_cmb0Es-/view?usp=sharing |

---

## Stack Tecnológico

### Frontend
- **React 19** (runtime `react`/`react-dom` ^18.3.1) con **TypeScript**
- **Vite 6** como bundler, con **React Router v7** para navegación
- **Tailwind CSS v4** para estilos
- **shadcn/ui** + **Radix UI** + **MUI** como librerías de componentes
- **Recharts** para gráficos, **Sonner** para notificaciones toast, **Lucide React** para iconografía
- **React Hook Form** para formularios

### Backend
- **Java 21** con **Spring Boot 3.5**
- **Spring Web** + **Spring Data JPA** (Hibernate) sobre **PostgreSQL**
- **Spring Security** + **JWT** (`jjwt` — Access Token + Refresh Token)
- **Bean Validation** (`spring-boot-starter-validation`)
- **iText 7** para la generación de reportes en PDF
- **File System** local para persistencia de comprobantes de pago
- **Spring Scheduling** para el job diario de detección de mora

### Infraestructura
- **Docker Compose** para levantar la base de datos en desarrollo
- Base de datos: **PostgreSQL 16**
- **Maven Wrapper** (`mvnw`) — no requiere tener Maven instalado globalmente
- `Dockerfile` multi-stage para build y ejecución del backend en contenedor

---

## Estructura del repositorio

```
CuentasClaras/
├── back/                        # API REST (Spring Boot)
│   ├── src/main/java/com/cuentasclaras/back/
│   │   ├── controller/           # Endpoints REST (Auth, Consortium, FamilyHome, Finance, Mora, etc.)
│   │   ├── service/               # Lógica de negocio (distribución de gastos, mora, balances)
│   │   ├── repository/            # Repositorios JPA
│   │   ├── model/ (o entity/)     # Entidades JPA
│   │   ├── security/              # Configuración de Spring Security + filtros JWT
│   │   └── config/                # DataSeeder y configuración general
│   ├── src/test/java/
│   │   ├── unit/                  # Tests unitarios de servicios
│   │   └── integration/           # Tests de integración de controllers
│   ├── docker-compose.yml         # Levanta PostgreSQL 16 localmente
│   ├── Dockerfile                 # Build multi-stage para el backend
│   ├── env                        # Plantilla de variables de entorno (ver sección Variables de entorno)
│   └── run.sh                     # Carga .env y ejecuta ./mvnw spring-boot:run
│
├── front/                        # SPA (React + Vite + TypeScript)
│   └── src/
│       ├── app/
│       │   ├── pages/              # Pantallas (Dashboard, CargarGasto, GestionMora, etc.)
│       │   ├── components/         # Componentes reutilizables (Layout, MoraBanner, LogoMark, ui/)
│       │   ├── context/            # Contextos de React (sesión, grupo activo, etc.)
│       │   └── routes.tsx          # Definición de rutas
│       ├── services/                # Clientes HTTP hacia el backend (apiClient, consortiumService, etc.)
│       └── styles/                  # CSS global y assets (logo, theme.css)
│
└── README.md                     # Este archivo
```

---

## Features de la v3

Las funcionalidades fueron priorizadas y validadas a través de la entrevista con **Alejandro**, experto en administración de propiedades horizontales, e iteradas en sprints sucesivos. A continuación se describe cada feature y su correspondencia con los requerimientos identificados.

---

### 1. Autenticación con JWT (Login / Registro)

Los usuarios pueden registrarse con nombre, email y contraseña, e iniciar sesión obteniendo un Access Token y un Refresh Token. La sesión se rehidrata automáticamente al recargar la página.

**Base en la entrevista:** La necesidad de identificar a cada socio individualmente para asociarle gastos, balances y roles surge como requisito implícito en toda la entrevista. El concepto de "el administrador somos todos" requiere que cada usuario tenga identidad propia dentro del sistema.

---

### 2. Gestión de Grupos: Consorcio y Casa Familiar (US-02)

Los usuarios pueden crear un grupo eligiendo entre dos modalidades completamente implementadas:

- **Propiedad Horizontal (Consorcio):** para edificios con expensas, fondo común, distribución por porcentajes y administración formal.
- **Casa Familiar (FamilyHome):** para casas compartidas con gastos más esporádicos. Cuenta con su propio dashboard, sistema de gastos, cálculo de balances y notificación de pagos. Los miembros se unen mediante un código de invitación de 8 caracteres. Cualquier miembro puede cargar gastos y el sistema distribuye automáticamente el monto entre los balances individuales.

**Base en la entrevista:** Alejandro marcó explícitamente la diferencia entre ambos casos: *"Lo que están mostrando lo veo más adecuado para una casa [...]. En una propiedad horizontal debería haber un fondo común."* Esta distinción motivó mantener ambas modalidades con lógicas completamente diferenciadas.

---

### 3. Invitaciones por Código a Usuarios no Registrados (US-03)

Sistema de invitaciones mediante código alfanumérico. El administrador genera un código de invitación único dentro del grupo y lo comparte con la persona que desea incorporar (por el medio que prefieran: WhatsApp, teléfono, presencial). Quien recibe el código ingresa a la plataforma, lo ingresa en la pantalla "Unirse a un grupo" y queda automáticamente asociado al grupo, incluso si aún no estaba registrado (el flujo de registro está integrado en el proceso de unión).

Originalmente se implementó un sistema de invitaciones por email con token UUID y Spring Mail, pero se descartó para esta version porque Google bloqueaba los envíos desde las IPs de los dispositivos de desarrollo. Se optó por el modelo por código, más simple y sin dependencias externas de correo.

**Origen del requerimiento:** La necesidad de invitar a vecinos sin cuenta técnica surgió del flujo real de incorporación a un consorcio, donde no todos los propietarios están familiarizados con la plataforma. El diseño por código simplifica la incorporación al eliminar la dependencia del correo electrónico.

---

### 4. Sistema de Roles: Admin y Member

Dentro de cada grupo existe un sistema de roles. Los **administradores** pueden cargar gastos fijos, configurar pesos, promover o degradar miembros, expulsar integrantes y gestionar la mora. Los **miembros** pueden cargar gastos extraordinarios, consultar su situación financiera y notificar pagos.

**Base en la entrevista:** Alejandro sugirió que no todos los miembros deberían tener los mismos permisos sobre ciertos tipos de gastos: *"Se podría definir dos o tres unidades que lideren o hagan de administradores de este tipo de gastos."*

---

### 5. Tipos de Gasto: Fijos y Extraordinarios

El sistema diferencia dos categorías de gastos:
- **Gastos Fijos:** expensas mensuales, servicios, abonos. Solo los puede cargar un administrador. Se distribuyen proporcionalmente según el peso de cada miembro.
- **Gastos Extraordinarios:** reparaciones puntuales, imprevistos. Cualquier miembro puede cargarlos. Se dividen en partes iguales.

**Base en la entrevista:** Alejandro explicó en detalle esta distinción: *"Los gastos regulares —todos los meses fijos— tienen que ver con abonos, impuestos [...] y estaría bueno automatizarlos. Los gastos extraordinarios —algo spot, algo específico— como el jardinero de diciembre a marzo, tratarlos aparte."*

---

### 6. División Proporcional de Gastos Fijos por Peso (US-05/US-06)

Cada miembro del grupo tiene un **factor de peso** configurable (basado en los metros cuadrados de su unidad). Los gastos fijos se distribuyen de forma proporcional: cada miembro aporta `gasto × (peso del miembro / peso total)`. Los gastos extraordinarios continúan dividiéndose en partes iguales. El administrador puede ajustar el peso de cada miembro desde la configuración del grupo. El sistema soporta tanto consorcios (`FinanceService`) como casas familiares (`WeightDistributionService`).

**Base en la entrevista:** Alejandro señaló que la configuración inicial de porcentajes por superficie debería estar disponible para el administrador. Esta feature responde directamente a esa necesidad, permitiendo que un propietario con un departamento de 80 m² contribuya proporcionalmente más que uno con 40 m².

---

### 7. Carga de Gastos con Categorías

Cualquier miembro (con las restricciones de rol correspondientes) puede registrar un gasto indicando descripción, monto, fecha, categoría (limpieza, reparaciones, servicios, impuestos, etc.) y notas opcionales. Aplica tanto a consorcios como a casas familiares.

**Base en la entrevista:** El detalle de los rubros del balance que describió Alejandro —*"gastos administrativos, servicios públicos, abonos de servicio, gastos del banco, reparaciones comunes, seguros"*— orientó el diseño de las categorías disponibles en el formulario.

---

### 8. Balance por Miembro y Compensación

El sistema calcula automáticamente la situación de cada miembro: cuánto le corresponde pagar según la distribución (considerando el peso para gastos fijos), cuánto aportó cargando gastos, y si tiene saldo a favor o debe aportar más al fondo.

**Base en la entrevista:** Alejandro describió el mecanismo con precisión: *"Esos $19.500 son los que te quedan a favor a vos como inquilino X, porque pagaste cierta cantidad de gastos [...]. Yo como inquilino pagué un servicio y quedé a favor porque, distribuido equitativamente entre todos, me correspondía pagar un poco menos."* También aclaró que el saldo a favor no se devuelve en efectivo sino que queda como crédito para el próximo período.

---

### 9. Cuenta Corriente Individual

Cada miembro puede consultar su situación personal en el período actual: cuánto debe, cuánto tiene a su favor, y los datos bancarios para realizar el pago al fondo común.

**Base en la entrevista:** La descripción del sistema de créditos y débitos individuales provino directamente de la entrevista: *"Donde dice 'recuperas' debería decir, a mi criterio, 'crédito': te queda un crédito de $19.500, de manera que el mes que viene, en las próximas expensas, debería figurar ese crédito."*

---

### 10. Flujo de Pago y Validación de Comprobantes (US-11)

Los miembros con saldo pendiente pueden iniciar el flujo de pago: se les muestran los datos bancarios del grupo (CBU, alias, titular) y pueden adjuntar un comprobante de transferencia (JPEG, PNG o PDF, máximo 10 MB). El archivo se persiste en el backend (`./uploads/comprobantes/`). El administrador revisa los comprobantes pendientes en una pantalla dedicada y puede **aprobar** (lo que acredita el pago en el fondo común y actualiza el balance del miembro) o **rechazar** (con un motivo, permitiendo al miembro re-subir). Se previenen rechazos múltiples y re-upload tras aprobación.

**Base en la entrevista:** Alejandro mencionó la necesidad de registrar los pagos y el timing de cobranza: *"En general está armado para que las expensas venzan los primeros 5 días del mes y los impuestos y abonos vencen a partir del décimo día: primero cobrás y después pagás."* El flujo de comprobante responde a la necesidad de trazabilidad sin depender de un administrador profesional.

---

### 11. Gestión de Mora (US-07)

El sistema incluye un scheduler diario (00:05) que evalúa automáticamente a todos los miembros: si su balance es negativo y superaron la fecha de vencimiento, se les marca como `EN_MORA`. Los miembros en mora ven un banner en el dashboard y tienen restricciones operativas (no pueden cargar nuevos gastos). El administrador puede:
- Visualizar el panel de mora con deuda, días de atraso y estado de notificación.
- Establecer fechas de vencimiento individuales.
- Marcar notificaciones como enviadas para llevar registro de las comunicaciones al moroso.

**Origen del requerimiento:** La gestión de mora e intereses fue validada en la entrevista como necesaria para el funcionamiento real del consorcio. El scheduler nocturno garantiza la detección automática sin intervención manual.

---

### 12. Vista de Estado de Cuentas y Fondo Común

Los administradores acceden a una pantalla global que muestra:
- **Estado de cuentas:** balance de todos los miembros (a favor, en mora o balanceado) con montos exactos, con navegación a la gestión de mora.
- **Fondo común:** saldo actual, historial de ingresos y egresos, y datos bancarios para transferencias.
- **Balance global:** saldo inicial, ingresos del período, egresos y saldo al cierre.

**Base en la entrevista:** Alejandro distinguió claramente entre la información global y la individual: *"El tab de estado financiero o balance no debería tener información de una persona en particular; debería ser un global que englobe todo."* También fue enfático sobre el fondo operativo: *"En una propiedad horizontal debería haber un fondo común en una cuenta bancaria o billetera, desde donde se hagan los gastos del consorcio y también los cobros, y eso da el estado financiero del edificio."*

---

### 13. Gestión de Miembros del Grupo (US-12)

Administración completa de miembros estabilizada. Los administradores pueden **promover** a miembros (a ADMIN), **degradar** a otros admins (a MEMBER) y **expulsar** integrantes del grupo (siempre que su balance sea cero). Los miembros pueden **abandonar** el grupo voluntariamente (requiere saldo en cero; el admin único debe promover a otro primero). Cada acción pasa por un diálogo de confirmación con descripción específica. Disponible tanto para Consorcio como para Casa Familiar.

**Base en la entrevista:** La idea de tener un grupo reducido con privilegios especiales fue planteada por Alejandro: *"Me parece bien que sea democrático y transparente para todos, pero tal vez es necesario que un grupo —uno, dos o tres usuarios— tenga un cierto privilegio diferente al resto."*

---

## Gestión del Proyecto

El proyecto se gestionó con metodología ágil utilizando **Jira** para el seguimiento de tareas, historias de usuario y sprints. El diseño colaborativo y los flujos de pantalla se trabajaron en **Mural**.

La entrevista con el experto Alejandro fue la principal fuente de validación para priorizar el backlog inicial. Las preguntas base y la transcripción completa de la entrevista forman parte de la documentación del proyecto.

---

## Puesta en Marcha

### Requisitos previos

| Herramienta | Versión | Notas |
|---|---|---|
| **Java** | 21+ | El backend no requiere Maven instalado: usa el wrapper `./mvnw` |
| **Node.js** | 18+ | Se recomienda usar `npm` (hay `package-lock.json` versionado) |
| **Docker** y **Docker Compose** | Última estable | Para levantar PostgreSQL sin instalarlo localmente |

> No es obligatorio usar Docker para la base de datos: si ya tenés un PostgreSQL 16 corriendo localmente,
> podés omitir ese paso y sobreescribir las variables `SPRING_DATASOURCE_*` (ver más abajo) para apuntar a tu instancia.

### 1. Base de datos (Docker)

```bash
cd back
docker compose up -d
```

Esto levanta un contenedor `cuentasclaras-db` con PostgreSQL 16 en el puerto `5432`, base `cuentasclaras`,
usuario `postgres` y contraseña `1234` (valores de desarrollo, ver `docker-compose.yml`). Los datos persisten
en un volumen Docker aunque bajes el contenedor con `docker compose down`.

### 2. Backend

```bash
cd back

cp env .env

./run.sh

./mvnw spring-boot:run
```

El servidor queda disponible en **`http://localhost:8080`**. Al arrancar, `DataSeeder` crea automáticamente
datos de prueba (usuarios, un consorcio de ejemplo e invitaciones) si la base está vacía.

Para compilar el `.jar` sin levantar el servidor:

```bash
./mvnw clean package -DskipTests
```

### 3. Frontend

```bash
cd front
npm install
npm run dev
```

La app queda disponible en **`http://localhost:5173`** y por defecto apunta al backend en `http://localhost:8080`
(configurable con la variable `VITE_API_URL`, ver más abajo).

Para generar el build de producción:

```bash
npm run build
```

### Usuarios de prueba

Generados automáticamente por el seed al levantar el backend por primera vez sobre una base vacía:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@cuentasclaras.com | admin123 | Admin |
| carlos@cuentasclaras.com | carlos123 | Miembro |
| maria@cuentasclaras.com | maria123 | Miembro |

### Variables de entorno

El backend lee configuración de `back/src/main/resources/application.yml`, con valores por defecto que se
pueden sobreescribir por variable de entorno. El archivo `back/env` es una **plantilla de ejemplo** (no se
carga automáticamente: para que `run.sh` la tome hay que copiarla a `back/.env`).

| Variable | Default | Descripción |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/cuentasclaras` | URL de conexión a PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | Usuario de la base |
| `SPRING_DATASOURCE_PASSWORD` | `1234` | Contraseña de la base |
| `JWT_SECRET` | clave de desarrollo embebida | Secreto usado para firmar los JWT — **cambiar en cualquier ambiente real** |
| `PORT` | `8080` | Puerto del backend |
| `UPLOAD_DIR` | `./uploads/comprobantes` | Carpeta donde se persisten los comprobantes de pago subidos |
| `APP_FRONTEND_BASE_URL` | `http://localhost:5173` | URL del frontend, usada para armar links (ej. invitaciones) |
| `MAIL_*` / `APP_MAIL_ENABLED` | — | Configuración SMTP para el envío de invitaciones por email (feature parcial, deshabilitada por defecto en esta versión — ver [Deuda técnica](#estado-de-la-v3-y-deuda-técnica)) |

El frontend lee una única variable opcional:

| Variable | Default | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | URL base del backend consumida por el frontend |

---

## API — Endpoints principales

Todos los endpoints, salvo `/api/auth/**`, `/api/usuarios/registro` y `/api/health`, requieren el header
`Authorization: Bearer <access_token>` obtenido en el login.

| Módulo | Método | Endpoint | Descripción |
|---|---|---|---|
| **Salud** | GET | `/api/health` | Chequeo de disponibilidad del servicio |
| **Auth** | POST | `/api/auth/login` | Login, devuelve access + refresh token |
| | POST | `/api/auth/refresh` | Renueva el access token |
| **Usuarios** | POST | `/api/usuarios/registro` | Alta de usuario |
| | GET | `/api/usuarios` / `/api/usuarios/{id}` | Listado / detalle de usuario |
| | DELETE | `/api/usuarios/{id}` | Baja de usuario |
| **Consorcios** | POST / GET | `/api/consortiums` | Crear / listar consorcios |
| | GET | `/api/consortiums/mine` | Consorcios del usuario autenticado |
| | GET | `/api/consortiums/{id}` | Detalle de un consorcio |
| | GET | `/api/consortiums/by-code/{code}` | Buscar consorcio por código de invitación |
| | POST | `/api/consortiums/join-by-code` | Unirse a un consorcio por código |
| | POST | `/api/consortiums/{id}/members` | Agregar miembro |
| | POST | `/api/consortiums/{id}/members/{userId}/promote` \| `/demote` | Promover / degradar rol |
| | DELETE | `/api/consortiums/{id}/members/{userId}` \| `/members/me` | Expulsar / abandonar |
| | PUT | `/api/consortiums/{id}/bank-details` \| `/name` \| `/dia-cierre` | Editar datos del grupo |
| | PUT | `/api/consortiums/{id}/members/{userId}/metros-cuadrados` | Ajustar peso (m²) de un miembro |
| **Casa Familiar** | POST / GET | `/api/family-homes` | Crear / listar casas familiares |
| | GET | `/api/family-homes/mine` \| `/{id}` | Casas del usuario / detalle |
| | GET | `/api/family-homes/by-code/{code}` · POST `/join-by-code` | Unirse por código |
| | POST / DELETE | `/api/family-homes/{id}/members...` | Alta / baja de miembros |
| | POST / GET | `/api/family-homes/{id}/expenses` | Cargar / listar gastos |
| | GET | `/api/family-homes/{id}/balance` | Balance del grupo |
| | POST | `/api/family-homes/{id}/pay` | Registrar pago |
| **Finanzas (consorcio)** | GET | `/api/dashboard/{grupoId}` \| `/api/balance/{grupoId}` | Dashboard y balance |
| | GET / POST | `/api/gastos` (`/{grupoId}` para listar) | Gastos fijos y extraordinarios |
| | GET / POST | `/api/pagos` (`/{grupoId}` para listar) | Registro de pagos |
| **Comprobantes** | POST | `/api/comprobantes/pago/{paymentId}` | Subir comprobante (multipart) |
| | POST | `/api/comprobantes/{id}/aprobar` \| `/rechazar` | Validar comprobante |
| | GET | `/api/comprobantes/{id}/archivo` \| `/pendientes/{grupoId}` | Descargar / listar pendientes |
| **Mora** | GET | `/api/mora/consorcio/{id}` \| `/mi-estado/{id}` | Panel de mora / estado individual |
| | PUT | `/api/mora/fecha-vencimiento` | Configurar vencimientos |
| | POST | `/api/mora/notificar/{id}` \| `/evaluar` | Notificar / correr evaluación de mora |
| **Fondo común** | GET / POST | `/api/fondo/{grupoId}` \| `/api/fondo` | Consultar / registrar movimientos del fondo |
| **Gastos recurrentes** | POST / GET | `/api/recurrentes` (`/{grupoId}`) | Alta / listado |
| | PUT | `/api/recurrentes/{id}/monto` \| `/toggle` | Editar monto / activar-desactivar |
| | POST | `/api/recurrentes/{id}/aplicar` | Aplicar gasto recurrente al período |
| **Períodos** | GET | `/api/periodos/{consortiumId}/actual` \| `/{periodId}` | Período actual / histórico |
| | POST | `/api/periodos/{consortiumId}/cerrar` | Cerrar período |
| **Reportes** | GET | `/api/reports/monthly/{consortiumId}` (+ `/preview`) \| `/period/{periodId}` | Reportes en PDF |
| **Invitaciones** | GET | `/api/invitations/accept` | Aceptar invitación |
| | POST | `/api/invitations/process-mine` | Procesar invitaciones pendientes del usuario logueado |

---

## Tests

El backend incluye tests unitarios (servicios) y de integración (controllers, contra una base H2 en memoria):

```bash
cd back
./mvnw test
```

---

## Créditos

Este proyecto usa componentes de [shadcn/ui](https://ui.shadcn.com/) (MIT) y fotos de [Unsplash](https://unsplash.com)
bajo su [licencia](https://unsplash.com/license) — ver [`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md) para el detalle completo.

---

*CuentasClaras v3 · GDSI · FIUBA · 2026*