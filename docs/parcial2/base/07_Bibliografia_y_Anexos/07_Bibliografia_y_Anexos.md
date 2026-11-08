---
tags:
  - si2
  - parcial2
  - mirroria
  - bibliografia
  - anexos
  - capitulo7
date: 2026-11-07
---

# 7. BIBLIOGRAFÍA Y 8. ANEXOS

---

## 7. BIBLIOGRAFÍA

* **Bass, L., Clements, P., & Kazman, R. (2021).** *Software Architecture in Practice* (4.ª ed.). Addison-Wesley Professional.
* **Bishop, C. M. (2006).** *Pattern Recognition and Machine Learning*. Springer.
* **Booch, G., Rumbaugh, J., & Jacobson, I. (2006).** *El Lenguaje Unificado de Modelado: Guía del Usuario* (2.ª ed.). Addison-Wesley.
* **Breiman, L. (2001).** Random Forests. *Machine Learning*, 45(1), 5–32. https://doi.org/10.1023/A:1010933404324
* **Chong, F., & Carraro, G. (2006).** *Architecture Strategies for Catching the Long Tail: Software as a Service (SaaS)*. Microsoft Corporation.
* **Cox, D. R. (1958).** The Regression Analysis of Binary Sequences. *Journal of the Royal Statistical Society: Series B (Methodological)*, 20(2), 215–242.
* **Facebook Open Source. (2024).** *React 19 Documentation: The library for web and native user interfaces*. Meta Platforms, Inc. https://react.dev/
* **Hastie, T., Tibshirani, R., & Friedman, J. (2009).** *The Elements of Statistical Learning: Data Mining, Inference, and Prediction* (2.ª ed.). Springer.
* **Liu, F. T., Ting, K. M., & Zhou, Z.-H. (2008).** Isolation Forest. En *Eighth IEEE International Conference on Data Mining (ICDM)* (pp. 413–422). IEEE. https://doi.org/10.1109/ICDM.2008.17
* **MacQueen, J. (1967).** Some Methods for Classification and Analysis of Multivariate Observations. En *Proceedings of the Fifth Berkeley Symposium on Mathematical Statistics and Probability* (Vol. 1, pp. 281–297). University of California Press.
* **Martin, R. C. (2018).** *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.
* **NestJS Core Team. (2024).** *NestJS Documentation: A progressive Node.js framework for building efficient, reliable and scalable server-side applications*. https://docs.nestjs.com/
* **Object Management Group (OMG). (2017).** *OMG Unified Modeling Language (OMG UML), Version 2.5.1*. Object Management Group. https://www.omg.org/spec/UML/2.5.1/
* **Python Software Foundation. (2024).** *Python 3.12 Documentation*. https://docs.python.org/3/
* **Ramírez, S. (Tiangolo). (2024).** *FastAPI: High performance, easy to learn, fast to code, ready for production*. https://fastapi.tiangolo.com/
* **Rosenberg, D., & Stephens, M. (2007).** *Use Case Driven Object Modeling with UML: Theory and Practice*. Apress. https://doi.org/10.1007/978-1-4302-0243-1
* **Stripe Inc. (2024).** *Stripe API Reference: Accept payments online and in-person*. https://stripe.com/docs/api
* **The PostgreSQL Global Development Group. (2024).** *PostgreSQL 16.5 Documentation*. https://www.postgresql.org/docs/16/
* **World Wide Web Consortium (W3C). (2018).** *Web Content Accessibility Guidelines (WCAG) 2.1: W3C Recommendation*. https://www.w3.org/TR/WCAG21/
* **World Wide Web Consortium (W3C). (2015).** *Indexed Database API (IndexedDB): W3C Recommendation*. https://www.w3.org/TR/IndexedDB/

---

## 8. ANEXOS

---

### Anexo A: Catálogo Histórico de Casos de Uso del 1.er Ciclo (Línea Base PUDS)

Para garantizar la consistencia longitudinal del proyecto, se incorpora la matriz de casos de uso funcionales completados durante la primera entrega (CU01 a CU24), hoy plenamente integrados en el espacio de trabajo de la boutique oficial **Tiendaria** (`/t/tiendaria`):

| Código | Nombre del Caso de Uso | Actores Primarios | Propósito Funcional | Prioridad Inicial |
| :--- | :--- | :--- | :--- | :--- |
| **CU01** | Registrar Usuario | `CUSTOMER` | Autocreación de cuentas de clientas en la boutique con email único. | Alta |
| **CU02** | Iniciar Sesión | Todos los Actores | Verificación de credenciales BCrypt y emisión de Access Token JWT. | Alta |
| **CU03** | Gestionar Usuarios y Roles | `ADMIN` | Asignación de roles institucionales (`CAJERO`, `ENCARGADO`) y sucursales. | Alta |
| **CU04** | Gestionar Proveedores | `ADMIN` | Alta de empresas confeccionistas y talleres de suministro textil. | Media |
| **CU05** | Gestionar Categorías | `ADMIN` | Taxonomía jerárquica de prendas con slug amigable para la web. | Alta |
| **CU06** | Gestionar Temporadas y Colecciones | `ADMIN` | Parametrización de colecciones vinculadas obligatoriamente a talleres. | Media |
| **CU07** | Gestionar Tallas y Colores | `ADMIN` | Catálogo normalizado de tallas ordenadas y colores con código HEX. | Alta |
| **CU08** | Gestionar Productos y Variantes | `ADMIN` | Publicación de prendas maestras con imágenes y combinaciones SKU. | Alta |
| **CU09** | Explorar Catálogo de Prendas | `CUSTOMER`, Visitante | Navegación de vitrinas, filtrado por categorías y fichas técnicas. | Alta |
| **CU10** | Consultar Stock por Sucursal | `CUSTOMER`, `CAJERO` | Verificación de existencias físicas disponibles en cada tienda física. | Alta |
| **CU11** | Gestionar Carrito de Compras | `CUSTOMER` | Adición de variantes a la bolsa `jsonb` con tope de 3 unidades. | Alta |
| **CU12** | Procesar Checkout Digital | `CUSTOMER` | Conversión del carrito a venta `PENDIENTE` con descuento atómico. | Alta |
| **CU13** | Registrar Venta Presencial en Caja | `CAJERO` | Venta física inmediata en mostrador emitiendo comprobante fiscal. | Alta |
| **CU14** | Consultar Historial de Compras | `CUSTOMER`, `ADMIN` | Vista detallada de pedidos y comprobantes emitidos en "Mis pedidos". | Media |
| **CU15** | Gestionar Ciudades y Sucursales | `ADMIN` | Alta de puntos de venta físicos en las capitales de Bolivia. | Alta |
| **CU16** | Gestionar Órdenes de Compra | `ADMIN` | Emisión de pedidos de confección incrementando el stock en tránsito. | Media |
| **CU17** | Recepcionar Pedido de Proveedor | `ENCARGADO_SUCURSAL` | Llegada de mercancía a tienda aumentando la `cantidad_disponible`. | Alta |
| **CU18** | Ajustar Stock Manualmente | `ENCARGADO`, `ADMIN` | Corrección de existencias por mermas con justificación explícita. | Media |
| **CU19** | Auditar Kardex de Movimientos | `ADMIN`, `ENCARGADO` | Traza inmutable de movimientos (`VENTA`, `RESERVA`, `RECEPCION`, `AJUSTE`). | Alta |
| **CU20** | Solicitar Reserva en Tienda | `CUSTOMER` | Bloqueo temporal de prendas en `cantidad_reservada` para probador. | Alta |
| **CU21** | Gestionar Estado de Reserva | `ENCARGADO_SUCURSAL` | Avance del ciclo de vida de la cita (`CONFIRMADA`, `EN_TIENDA`). | Alta |
| **CU22** | Cobrar Reserva en Punto POS | `CAJERO` | Cierre de reserva en mostrador mediante venta física y liberación de stock. | Alta |
| **CU23** | Cancelar Reserva de Prendas | `CUSTOMER`, `ENCARGADO` | Anulación de cita con restitución inmediata de unidades a stock libre. | Media |
| **CU24** | Generar Reportes Dinámicos por IA | `ADMIN`, `ENCARGADO` | Formulación de consultas en lenguaje natural (texto o voz) con LLM. | Alta |

---

### Anexo B: Enlaces Oficiales del Repositorio y Despliegue en la Nube

Para facilitar la verificación de los resultados por parte de la docente y el tribunal evaluador, se suministran los accesos oficiales a los artefactos de software:

* **Repositorio de Código Fuente (Monorepo GitHub):**  
  [https://github.com/mopy1/MirrorIA](https://github.com/mopy1/MirrorIA)  
  *Estructura monorepo con `mirroria-backend/`, `mirroria-frontend/`, `mirroria-ml/`, `scripts/` y `db/`.*
* **Despliegue en Producción (Máquina Virtual en Azure Cloud; se redespliega con `scripts/deploy-azure.sh` antes de la defensa):**  
  [https://mirroria.duckdns.org](https://mirroria.duckdns.org)  
  *Despliegue asegurado con certificados TLS/SSL válidos de Let's Encrypt sobre Nginx reverse proxy, PostgreSQL 16 y Docker.*
* **Documentación Interactiva de la API (Swagger UI):**  
  `http://localhost:3000/api/docs` *(Habilitado en entornos de desarrollo y evaluación local).*
