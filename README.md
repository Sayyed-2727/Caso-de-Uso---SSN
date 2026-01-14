# ✈️ Travel Tracker

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
* [Costes](#-costes)
* [Autores](#-autores)

---

## 🚀 Características

* ✅ **Monitorización automática** de precios de vuelos cada 1 hora.
* 📧 **Notificaciones por email** inmediatas a través de AWS SNS.
* 🎯 **Detección de oportunidades**: Notifica cuando el precio actual es menor al precio guardado en la alerta.
* 🗄️ **Persistencia en DynamoDB**: Gestión eficiente de alertas activas.
* 🐳 **Despliegue con Docker Compose**: Entorno reproducible y aislado.
* 📊 **API REST**: Backend ligero y rápido con FastAPI.
* 🌐 **Interfaz web**: SPA responsiva para buscar vuelos y crear alertas.
* ☁️ **Arquitectura cloud-native**: Desacoplada y escalable (Productor/Consumidor).

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
│ • Alerts │            │             │     │             │
│          │            │  Amadeus    │     │   Email     │
│          │            │  API Client │     │   Alerts    │
└──────────┘            └─────────────┘     └─────────────┘
```

---

## 📦 Requisitos Previos

### Software Requerido

| Herramienta    | Versión Mínima |
| -------------- | ---------------- |
| Docker Engine  | 24.0+            |
| Docker Compose | 2.23+            |
| Python         | 3.11+            |

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

El sistema utiliza **una sola pareja de credenciales AWS** definida mediante variables de entorno para todo el sistema (Backend y Worker).

#### Usando archivo `.env`

Crea un archivo `.env` en la raíz del proyecto (ignorado por git):

```bash
cp .env.example .env
```

Y rellena tus datos:

```env
# AWS Credentials
AWS_ACCESS_KEY_ID=TU_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=TU_SECRET_KEY
AWS_SESSION_TOKEN=TU_SESSION_TOKEN
AWS_REGION=us-east-1

# SNS Configuration
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:AlertasVuelos # TODO: Cambiar por el ARN de tu tópico SNS

# Amadeus API (Vuelos)
AMADEUS_API_SECRET=tu_api_secret # TODO: Cambiar por tu API Secret de Amadeus
```

### 2️⃣ Inicializar Recursos AWS

Para crear automáticamente la tabla de DynamoDB y el Tópico SNS, ejecuta el script de configuración incluido.

Primero, exporta tus variables de entorno en la terminal (para que el script pueda conectar con AWS):

```bash
# Carga las variables del archivo .env a la sesión actual
export AWS_ACCESS_KEY_ID=TU_ACCESS_KEY
export AWS_SECRET_ACCESS_KEY=TU_SECRET_KEY
export AWS_SESSION_TOKEN=TU_SESSION_TOKEN

export SNS_TOPIC_ARN=TU_ARN

```

Y luego ejecuta el script de inicialización:

```bash
python3 infra/setup_aws.py
```

Deberías ver un mensaje confirmando la creación de la tabla `TravelAlerts` y el Tópico SNS.

**Nota:** Antes de ejecutar setup_aws.py tienes que tener instalada la librería boto3. Si no la tienes instalada, ejecuta `pip install boto3`.
---

## 🚀 Uso

Para levantar todo el entorno (Frontend, Backend y Worker):

```bash
docker-compose up --build
```

### Servicios

| Servicio | URL                               | Descripción  |
| -------- | --------------------------------- | ------------- |
| Frontend | [http://localhost](http://localhost) | Web principal |

### Endpoints Principales

* `GET /search`: Buscar vuelos en tiempo real (conecta con Amadeus).
* `POST /subscribe`: Crear una alerta de precio y guardar en DynamoDB.

---

## 👥 Autores

* Sayed Magdy Elsayed Abdellah
* Patricia Díez Herguido
* Ana Martín Serrano
* Adrian Julian Ramos Romero

---

## 📄 Licencia

Travel Tracker © 2026

---

**⭐ Proyecto académico – SSN 2026 ⭐**
