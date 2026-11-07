---
tags:
  - si2
  - parcial2
  - mirroria
  - conclusiones
  - recomendaciones
  - capitulo6
date: 2026-11-07
---

# CAPÍTULO VI. CONCLUSIONES Y RECOMENDACIONES

---

## 6.1. Conclusiones

Al culminar el ciclo de desarrollo y aseguramiento de calidad de la plataforma **MirrorIA**, se formulan las siguientes conclusiones de ingeniería:

1. **Evolución Exitosa hacia el Modelo SaaS Multi-tenant:**  
   Se cumplió plenamente el objetivo central de evolucionar el prototipo original de tienda monousuario hacia una **plataforma SaaS multi-tenant de comercio electrónico de moda femenina**, capaz de aprovisionar boutiques independientes de manera atómica en una base de datos relacional compartida en PostgreSQL 16, garantizando el aislamiento lógico absoluto mediante el discriminador `tenant_id` y el filtrado obligatorio por request (`X-Tenant`).
2. **Eficacia y Trazabilidad de la Metodología ICONIX:**  
   La adopción de la metodología **ICONIX** (*Doug Rosenberg & Matt Stephens*) permitió mantener una trazabilidad ininterrumpida y verificable entre los requisitos de negocio, los 17 casos de uso esenciales consolidados, los diagramas de robustez (BCE), los diagramas de secuencia UML 2.5 y las clases de diseño. El puente conceptual del análisis de robustez facilitó la detección temprana de inconsistencias antes de la fase de codificación, reduciendo drásticamente la deuda técnica.
3. **Resiliencia Operativa mediante Arquitectura Offline-First:**  
   La implementación de capacidades desconectadas combinando **React 19 PWA** con **IndexedDB** en navegadores web y **React Native / Expo** con **SQLite** en dispositivos móviles demostró que es viable mantener la facturación en mostrador físico y la navegación de vitrinas ante caídas imprevistas de telecomunicaciones. La persistencia en almacenes locales sobrevive intacta al cierre de aplicación o reinicios de terminal.
4. **Garantía Transaccional e Idempotencia en Sincronización:**  
   El protocolo de sincronización asíncrona respaldado por identificadores únicos **UUIDv4** y la cabecera canónica `Idempotency-Key` (con funciones de dispersión SHA-256) garantizó la estricta **idempotencia** de las transacciones, impidiendo dobles deducciones de inventario o duplicidad de cobros ante reintentos automáticos de red (`X-Cache-Idempotency: HIT`).
5. **Resolución Determinista del Conflicto de Concurrencia `stock = 1`:**  
   Frente al problema clásico de colisión desconectada por la última unidad disponible en percha, el sistema demostró que la autoridad transaccional única del servidor mediante sentencias SQL `UPDATE` condicionadas (`WHERE cantidad_disponible >= 1`) combinada con respuestas HTTP 409 tipadas (`STOCK_AGOTADO_CONFLICTO`) permite a los clientes ejecutar transacciones compensatorias (rollback local) y guiar a la usuaria hacia alternativas viables (otras sucursales o tallas) sin generar frustración ni estados corruptos.
6. **Democratización de Experiencias Inmersivas y Accesibilidad Universal:**  
   La integración del Probador Virtual por IA generativa (Decart `lucy-vton-3.5`) a través de credenciales efímeras seguras de 5 minutos, sumada a la validación matemática algorítmica de contraste accesible **WCAG 2.1** ($\ge 4.5:1$) en espacio cromático OKLCH para cada boutique, posiciona a la plataforma a la vanguardia de la experiencia de usuario y cumplimiento ético de accesibilidad web.
7. **Analítica de Alto Impacto y Machine Learning Desacoplado:**  
   La bifurcación de tableros de Business Intelligence (Consola Ejecutiva para directivos y Consola Operativa POS para cajeros), el confinamiento seguro de las consultas de DeepSeek LLM a un catálogo formal de 23 métricas parametrizadas (eliminando el riesgo de inyección o alucinación de SQL), la exportación nativa a hojas contables `.xlsx` (`exceljs`) y el despliegue del microservicio en Python FastAPI (:8002) con 4 modelos estadísticos reproducibles ($N=10.000$, `seed=42`) y **fallback heurístico resiliente** (`X-ML-Fallback: true`), dotan a las boutiques de herramientas predictivas de nivel corporativo para la prevención de quiebres de stock y mitigación de inasistencias en probador.

---

## 6.2. Recomendaciones

Con base en la experiencia obtenida durante la ejecución del proyecto y las oportunidades de optimización detectadas, se formulan las siguientes recomendaciones para futuras iteraciones del sistema:

1. **Validación Automática en Downgrade de Planes:**  
   Implementar un asistente interactivo que valide que una boutique cumpla con las restricciones de recursos antes de permitir el descenso de categoría de plan (por ejemplo, exigir la despublicación voluntaria de prendas si se pasa de 300 a 50 productos activos al cambiar de Crecimiento a Básico).
2. **Facturación Electrónica en Línea y Hardware Fiscal:**  
   Incorporar la integración nativa con los servicios web de Facturación en Línea del Servicio de Impuestos Nacionales (SIN) de Bolivia, permitiendo la firma digital de facturas XML y el soporte para impresión térmica directa en protocolos ESC/POS para impresoras de mostrador.
3. **Evolución hacia Arquitectura Dirigida por Eventos (EDA):**  
   Para escenarios de alta concurrencia masiva (ej. campañas de Black Friday con miles de transacciones por segundo), se recomienda desacoplar la sincronización de la cola outbox mediante un bus de mensajería distribuido como **RabbitMQ** o **Apache Kafka**, permitiendo encolar las peticiones y procesarlas en micro-lotes en background.
4. **Gestión Avanzada de Conflictos Multivariable:**  
   Expandir las capacidades de resolución de conflictos de stock en el cliente para permitir que el operador de caja modifique directamente la talla o aplique descuentos de cortesía sobre una prenda alternativa antes de reenviar la transacción rechazada.
5. **Paridad Total de Punto de Venta en la Aplicación Móvil:**  
   Evolucionar el módulo móvil de Expo para incorporar el lector óptico de códigos de barra y QR mediante la cámara del celular, transformando cualquier teléfono móvil en una terminal POS móvil completa de inventario y caja para vendedores de piso.
6. **Profundización de Modelos de Visión Artificial:**  
   Entrenar modelos locales de detección de puntos corporales (*pose estimation*) en el dispositivo móvil mediante TensorFlow Lite o CoreML, reduciendo el consumo de ancho de banda y la dependencia del servicio generativo en la nube para vistas previas rápidas en probador.
