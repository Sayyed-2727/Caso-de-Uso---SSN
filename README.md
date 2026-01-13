# ✈️ Flight Price Monitor

![AWS](https://img.shields.io/badge/AWS-DynamoDB%20%7C%20SNS-orange?logo=amazon-aws)
![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)
![License](https://img.shields.io/badge/License-MIT-green)

> **Sistema de Monitorización Reactiva y Notificación de Tarifas Aéreas mediante una Arquitectura Desacoplada en la Nube**

Sistema inteligente de monitorización de precios de vuelos que utiliza servicios gestionados de AWS (DynamoDB, SNS) y la API de Amadeus para detectar automáticamente reducciones de precio y notificar a los usuarios por email.

---

## 📋 Tabla de Contenidos

* [Características](#-características)
* [Arquitectura](#️-arquitectura)
* [Requisitos Previos](#-requisitos-previos)
* [Instalación](#-instalación)
* [Configuración](#️-configuración)
* [Uso](#-uso)
* [Desarrollo](#-desarrollo)
* [Troubleshooting](#-troubleshooting)
* [Costes](#-costes)
* [Contribuciones](#-contribuciones)
* [Autores](#-autores)
* [Licencia](#-licencia)

---

## 🚀 Características

* ✅ **Monitorización automática** de precios de vuelos cada 6 horas
* 📧 **Notificaciones por email** cuando el precio baja del umbral definido
* 🎯 **Alertas inteligentes** basadas en:

  * Precio bajo umbral absoluto
  * Reducción ≥ 15% respecto al promedio de 72h
  * Mínimo local (precio más bajo en 7 días)
* 🗄️ **Histórico de precios** almacenado en DynamoDB
* 🐳 **Despliegue con Docker Compose** (plug & play)
* 📊 **API REST documentada** con Swagger UI
* 🌐 **Interfaz web** responsiva y moderna
* ☁️ **Arquitectura cloud-native** desacoplada y escalable

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                               │
│         HTML5 + Vanilla JavaScript + Fetch API                  │
│                  http://localhost                               │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                             │
│         Python 3.11 + Pydantic + Uvicorn                        │
│               http://localhost:8000                             │
└─────┬──────────────────────────┬─────────────────┬─────────────┘
      │                          │                 │
      ▼                          ▼                 ▼
┌──────────┐            ┌─────────────┐     ┌─────────────┐
│ DynamoDB │            │   WORKER    │     │   AWS SNS   │
│          │◄───────────│  (Schedule) │────►│   Topics    │
│ • Users  │            │             │     │             │
│ • Routes │            │  Amadeus    │     │   Email     │
│ • Prices │            │  API Client │     │   Alerts    │
└──────────┘            └─────────────┘     └─────────────┘
```

---

## 📦 Requisitos Previos

### Software Requerido

| Herramienta    | Versión Mínima |
| -------------- | -------------- |
| Docker Engine  | 24.0+          |
| Docker Compose | 2.23+          |
| Git            | 2.30+          |

### Hardware Recomendado

* **CPU:** 2 cores o más
* **RAM:** 4 GB disponibles
* **Disco:** 2 GB libres
* **Sistema Operativo:** Linux, macOS, Windows 10/11

### Cuentas y Credenciales

* **Cuenta AWS única** con permisos para:

  * Amazon DynamoDB
  * Amazon SNS

> 🔐 **Nota importante:**
> Este proyecto utiliza **una única credencial de AWS compartida por todo el sistema** (backend y worker).
> **No es necesario crear múltiples usuarios IAM** ni usuarios por servicio.

* **Cuenta Amadeus for Developers** (Free Tier)

  * 2,000 transacciones/mes gratuitas

---

## 🛠️ Instalación

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/Sayyed-2727/Caso-de-Uso---SSN.git
cd Caso-de-Uso---SSN
```

---

## ⚙️ Configuración

### 1️⃣ Configurar Credenciales AWS (ÚNICAS)

El sistema utiliza **una sola pareja de credenciales AWS** definida mediante variables de entorno. Estas credenciales serán usadas automáticamente por:

* Backend (FastAPI)
* Worker de monitorización

#### Opción recomendada: AWS CLI

```bash
aws configure
```

Valores requeridos:

* **AWS Access Key ID**
* **AWS Secret Access Key**
* **Default region:** `us-east-1`
* **Output format:** `json`

> ✅ No es necesario crear usuarios adicionales ni roles separados.

---

### 2️⃣ Crear SNS Topic

El topic SNS es necesario para enviar notificaciones por email.

#### Desde AWS Console:

1. Acceder a https://console.aws.amazon.com/sns
2. Asegurarse de estar en región **us-east-1**
3. Ir a **Topics** → **Create topic**
4. Configurar:
   * Type: **Standard**
   * Name: `AlertasVuelos`
5. Click **Create topic**
6. Copiar el **ARN** del topic (ejemplo: `arn:aws:sns:us-east-1:123456789012:AlertasVuelos`)

#### Suscribir tu email:

1. Dentro del topic creado, ir a **Subscriptions** → **Create subscription**
2. Configurar:
   * Protocol: **Email**
   * Endpoint: tu email
3. Click **Create subscription**
4. **Importante:** Revisar tu correo y confirmar la suscripción

#### Alternativa con CLI:

```bash
aws sns create-topic --name AlertasVuelos --region us-east-1

aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789012:AlertasVuelos \
  --protocol email \
  --notification-endpoint tu-email@ejemplo.com
```

---

### 3️⃣ Credenciales de Amadeus

1. [https://developers.amadeus.com](https://developers.amadeus.com)
2. Crear aplicación (Self-Service)
3. Copiar:

   * `AMADEUS_API_KEY`
   * `AMADEUS_API_SECRET`

---

### 4️⃣ Archivo `.env`

```bash
cp .env.example .env
nano .env
```

**Descomentar y rellenar con tus credenciales:**

```env
AWS_ACCESS_KEY_ID=TU_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=TU_SECRET_KEY
AWS_REGION=us-east-1

SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:AlertasVuelos

AMADEUS_API_KEY=tu_api_key
AMADEUS_API_SECRET=tu_api_secret

WORKER_SCHEDULE_HOURS=6
LOG_LEVEL=INFO
```

🔒 **Importante:** Descomentar todas las líneas y rellenar con las credenciales reales antes de ejecutar.

---

## 🚀 Uso

```bash
docker-compose up --build
```

Servicios:

| Servicio    | URL                                                      |
| ----------- | -------------------------------------------------------- |
| Frontend    | [http://localhost](http://localhost)                     |
| Backend API | [http://localhost:8000](http://localhost:8000)           |
| Swagger     | [http://localhost:8000/docs](http://localhost:8000/docs) |

---

## 💰 Costes

* AWS Free Tier: **$0.00 estimado**
* Amadeus Free Tier: 2,000 llamadas/mes

---

## 👥 Autores

* **Sayed Magdy Elsayed Abdellah**
* Patricia Díez Herguido
* Ana Martín Serrano
* Adrian Julian Ramos Romero

---

## 📄 Licencia

MIT License © 2026 Flight Price Monitor Team

---

**⭐ Proyecto académico – credenciales AWS compartidas para simplificar despliegue y evaluación ⭐**
