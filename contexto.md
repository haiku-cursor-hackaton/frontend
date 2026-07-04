# UCP: modelo exacto de la especificación

A fecha del **4 de julio de 2026**, la versión estable documentada es **`2026-04-08`**.

UCP no es simplemente una colección fija de endpoints. Es una especificación compuesta por tres niveles:

1. **Modelo semántico:** catálogo, carrito, checkout, pagos y órdenes.
2. **Descubrimiento y negociación:** cada comercio publica qué capacidades y versiones soporta.
3. **Bindings de transporte:** las mismas operaciones pueden exponerse mediante REST, MCP, A2A o una experiencia embebida.

La especificación utiliza fechas RFC 3339 y expresa importes monetarios en **unidades menores**: `2500` significa `$25.00` cuando la moneda es USD. ([Universal Commerce Protocol][1])

```text
┌──────────────────────────────────────────────┐
│           OPERACIONES LÓGICAS UCP            │
│                                              │
│ Catalog · Cart · Checkout · Order · Identity │
└──────────────┬───────────────────────────────┘
               │
       bindings de transporte
               │
    ┌──────────┼──────────┬──────────┐
    ▼          ▼          ▼          ▼
   REST       MCP        A2A      Embedded
```

---

# 1. Actores del protocolo

UCP utiliza principalmente estos conceptos:

## Platform

Es el sistema que actúa frente al usuario:

* Agente de IA.
* Aplicación de compras.
* Buscador.
* Marketplace.
* Asistente conversacional.

La plataforma puede contener uno o varios agentes.

## Business

Es el comercio responsable de:

* Productos.
* Precios.
* Inventario.
* Impuestos.
* Entrega.
* Procesamiento comercial.
* Creación de la orden.

Normalmente conserva el papel de **Merchant of Record**.

## Payment handler

Define cómo se adquiere y presenta una credencial de pago compatible:

* Tarjeta tokenizada.
* Google Pay.
* Credencial cifrada.
* Token de procesador.
* Otro instrumento negociado.

## Buyer

La persona que está comprando y, cuando corresponde, autorizando la transacción.

---

# 2. Descubrimiento: `/.well-known/ucp`

Antes de llamar cualquier herramienta, la plataforma debe descubrir qué soporta el comercio.

## Endpoint

```http
GET /.well-known/ucp
```

Ejemplo:

```json
{
  "ucp": {
    "version": "2026-04-08",
    "supported_versions": {
      "2026-01-15": "https://shop.example/ucp/profiles/2026-01-15"
    },
    "services": {
      "dev.ucp.shopping": [
        {
          "version": "2026-04-08",
          "transport": "mcp",
          "endpoint": "https://shop.example/ucp/mcp",
          "schema": "https://ucp.dev/2026-04-08/services/shopping/mcp.openrpc.json"
        },
        {
          "version": "2026-04-08",
          "transport": "rest",
          "endpoint": "https://shop.example/ucp",
          "schema": "https://ucp.dev/2026-04-08/services/shopping/rest.openapi.json"
        }
      ]
    },
    "capabilities": {
      "dev.ucp.shopping.catalog": [
        {
          "version": "2026-04-08"
        }
      ],
      "dev.ucp.shopping.cart": [
        {
          "version": "2026-04-08"
        }
      ],
      "dev.ucp.shopping.checkout": [
        {
          "version": "2026-04-08"
        }
      ],
      "dev.ucp.shopping.order": [
        {
          "version": "2026-04-08"
        }
      ]
    },
    "payment_handlers": {
      "com.example.tokenized_card": [
        {
          "id": "com.example.tokenized_card",
          "version": "2026-04-08",
          "available_instruments": ["card"]
        }
      ]
    },
    "signing_keys": [
      {
        "kid": "merchant-key-2026",
        "kty": "OKP",
        "crv": "Ed25519",
        "x": "..."
      }
    ]
  }
}
```

El perfil declara:

* Versión UCP.
* Versiones anteriores compatibles.
* Transportes disponibles.
* Endpoint de cada transporte.
* Capacidades disponibles.
* Extensiones soportadas.
* Payment handlers.
* Claves públicas para verificar firmas.

UCP utiliza una negociación **server-selects**: la plataforma declara sus capacidades y el comercio selecciona la intersección compatible. No se asume que todos los comercios implementen todo UCP. ([Universal Commerce Protocol][1])

---

# 3. Identificación de la plataforma

## REST

Cada solicitud debe identificar el perfil del agente mediante:

```http
UCP-Agent: profile="https://agent.example/.well-known/ucp"
```

## MCP

La identidad se coloca en `meta`:

```json
{
  "meta": {
    "ucp-agent": {
      "profile": "https://agent.example/.well-known/ucp"
    }
  }
}
```

Este perfil permite al comercio:

* Comprobar la versión.
* Negociar capacidades.
* Identificar el agente.
* Encontrar sus claves públicas.
* Obtener, por ejemplo, el webhook donde enviar actualizaciones.

En MCP, `meta.ucp-agent.profile` es obligatorio en todas las llamadas UCP. ([Universal Commerce Protocol][2])

---

# 4. Autenticación

`UCP-Agent` identifica al actor, pero no necesariamente lo autentica.

La especificación permite:

* API keys.
* OAuth 2.0.
* mTLS.
* HTTP Message Signatures RFC 9421.

Cuando se usa API key, OAuth o mTLS, el comercio debe comprobar que la identidad autenticada está autorizada para representar el perfil indicado por `UCP-Agent`. ([Universal Commerce Protocol][1])

Ejemplo con API key:

```http
POST /ucp/checkout-sessions
UCP-Agent: profile="https://agent.example/.well-known/ucp"
X-API-Key: ucp_agent_live_...
Idempotency-Key: 8da1f672-...
Content-Type: application/json
```

Ejemplo firmado:

```http
UCP-Agent: profile="https://agent.example/.well-known/ucp"
Content-Digest: sha-256=:...:
Signature-Input: sig1=("@method" "@path" "content-digest" "ucp-agent");keyid="agent-key"
Signature: sig1=:...:
```

---

# 5. Formato común de respuestas

Los objetos suelen contener un sobre UCP:

```json
{
  "ucp": {
    "version": "2026-04-08",
    "status": "success",
    "capabilities": {
      "dev.ucp.shopping.checkout": [
        {
          "version": "2026-04-08"
        }
      ]
    }
  }
}
```

Hay que distinguir dos estados:

```text
ucp.status
└── indica si la operación protocolaria produjo un resultado

checkout.status
└── indica el estado comercial del checkout
```

## Errores técnicos

Se expresan como:

* HTTP `400`, `401`, `403`, `409`, `429`, `500`, etc.
* Error JSON-RPC en MCP.

Ejemplos:

* JSON inválido.
* Firma incorrecta.
* Falta de autenticación.
* Versión incompatible.
* Reutilización incorrecta de una clave de idempotencia.

## Resultados comerciales

No necesariamente son errores HTTP.

Por ejemplo, que un producto esté agotado puede devolver HTTP `200` o un resultado JSON-RPC normal, acompañado de:

```json
{
  "ucp": {
    "version": "2026-04-08",
    "status": "error"
  },
  "messages": [
    {
      "type": "error",
      "code": "out_of_stock",
      "content": "The selected variant is out of stock",
      "severity": "recoverable"
    }
  ]
}
```

La distinción evita confundir “la operación llegó correctamente al comercio” con “el negocio pudo aceptar la compra”. ([Universal Commerce Protocol][2])

---

# 6. Capability: Catalog

Identificador:

```text
dev.ucp.shopping.catalog
```

Permite:

* Buscar productos.
* Resolver productos o variantes por ID.
* Obtener el detalle autoritativo de un producto.

## Contratos MCP y REST

| Operación lógica    | MCP Tool         | REST                    |
| ------------------- | ---------------- | ----------------------- |
| Buscar catálogo     | `search_catalog` | `POST /catalog/search`  |
| Resolver varios IDs | `lookup_catalog` | `POST /catalog/lookup`  |
| Obtener detalle     | `get_product`    | `POST /catalog/product` |

UCP define esas tres herramientas como la interfaz MCP del catálogo. ([Universal Commerce Protocol][3])

---

## 6.1 `search_catalog`

Busca productos utilizando texto, filtros y contexto provisional.

### MCP

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_catalog",
    "arguments": {
      "meta": {
        "ucp-agent": {
          "profile": "https://agent.example/.well-known/ucp"
        }
      },
      "catalog": {
        "query": "zapatos azules para correr",
        "context": {
          "address_country": "SV",
          "intent": "entrenamiento diario"
        },
        "filters": {
          "price": {
            "maximum": 8000
          }
        },
        "pagination": {
          "limit": 10
        }
      }
    }
  }
}
```

### Entrada

| Campo         | Obligatorio | Propósito                                                       |
| ------------- | ----------: | --------------------------------------------------------------- |
| `query`       |          No | Consulta libre                                                  |
| `context`     |          No | País, región, intención y señales provisionales                 |
| `signals`     |          No | Señales observadas por la plataforma para riesgo o autorización |
| `attribution` |          No | Campaña, fuente, click ID                                       |
| `filters`     |          No | Filtros estructurados                                           |
| `pagination`  |          No | Cursor y tamaño solicitado                                      |

El `context` del catálogo es provisional. No debe usarse como la única fuente para restricciones legales o elegibilidad; estas deben revalidarse durante checkout con datos vinculantes. ([Universal Commerce Protocol][3])

### Salida

```json
{
  "ucp": {
    "version": "2026-04-08"
  },
  "products": [
    {
      "id": "product_123",
      "title": "Running Shoe",
      "description": "Lightweight training shoe",
      "price": 7500,
      "currency": "USD"
    }
  ],
  "pagination": {
    "next_cursor": "cursor_2"
  }
}
```

---

## 6.2 `lookup_catalog`

Recupera varios productos o variantes a partir de identificadores conocidos.

### Entrada

```json
{
  "catalog": {
    "ids": [
      "product_123",
      "variant_123_blue_42"
    ],
    "context": {
      "address_country": "SV"
    }
  }
}
```

### Salida

```json
{
  "ucp": {
    "version": "2026-04-08"
  },
  "products": [
    {
      "id": "product_123",
      "title": "Running Shoe"
    }
  ],
  "messages": []
}
```

Puede haber éxito parcial: algunos IDs pueden resolverse y otros no. El comercio debe soportar IDs de producto y de variante. Esta operación resulta útil para comparar o refrescar múltiples resultados que el agente guardó previamente.

---

## 6.3 `get_product`

Obtiene el estado actual y completo de un producto.

### Entrada

```json
{
  "catalog": {
    "id": "product_123",
    "selected": {
      "color": "blue",
      "size": "42"
    },
    "preferences": {
      "currency": "USD"
    },
    "context": {
      "address_country": "SV"
    }
  }
}
```

### Salida

```json
{
  "ucp": {
    "version": "2026-04-08"
  },
  "product": {
    "id": "product_123",
    "title": "Running Shoe",
    "selected": {
      "color": "blue",
      "size": "42"
    },
    "available": true,
    "price": 7500,
    "currency": "USD"
  }
}
```

`get_product` es la operación de detalle autoritativo: debe reflejar selección efectiva, variantes y señales actuales de disponibilidad. ([Universal Commerce Protocol][4])

---

# 7. Capability: Cart

Identificador:

```text
dev.ucp.shopping.cart
```

El carrito es una sesión de exploración:

* Puede contener productos.
* Puede estimar totales.
* Puede persistirse.
* No representa todavía una autorización de pago.
* No produce una orden.

## Operaciones

| MCP Tool      | REST                      | Contrato                       |
| ------------- | ------------------------- | ------------------------------ |
| `create_cart` | `POST /carts`             | Crea un carrito                |
| `get_cart`    | `GET /carts/{id}`         | Obtiene su estado              |
| `update_cart` | `PUT /carts/{id}`         | Reemplaza su contenido mutable |
| `cancel_cart` | `POST /carts/{id}/cancel` | Invalida la sesión             |

Los bindings MCP separan el identificador del contenido: para `get`, `update` y `cancel`, `id` es un argumento de primer nivel; el objeto `cart` no debe incluir su propio `id`. ([Universal Commerce Protocol][2])

---

## 7.1 `create_cart`

### Entrada mínima

```json
{
  "cart": {
    "line_items": [
      {
        "item": {
          "id": "variant_blue_42"
        },
        "quantity": 1
      }
    ]
  }
}
```

Campos opcionales:

* `context`.
* `signals`.
* `attribution`.
* `buyer`.

### Salida

```json
{
  "ucp": {
    "version": "2026-04-08"
  },
  "id": "cart_abc123",
  "line_items": [
    {
      "id": "line_1",
      "item": {
        "id": "variant_blue_42",
        "title": "Running Shoe",
        "price": 7500
      },
      "quantity": 1,
      "totals": [
        {
          "type": "subtotal",
          "amount": 7500
        }
      ]
    }
  ],
  "currency": "USD",
  "totals": [
    {
      "type": "subtotal",
      "amount": 7500
    },
    {
      "type": "total",
      "amount": 7500
    }
  ],
  "continue_url": "https://shop.example/cart/cart_abc123",
  "expires_at": "2026-07-04T22:00:00Z"
}
```

Los totales de carrito pueden ser estimados o parciales porque todavía puede faltar dirección, envío o información fiscal. ([Universal Commerce Protocol][2])

---

## 7.2 `get_cart`

Entrada:

```json
{
  "id": "cart_abc123"
}
```

Salida: el recurso completo actual.

---

## 7.3 `update_cart`

La actualización es de **reemplazo completo**, no un parche parcial.

```json
{
  "id": "cart_abc123",
  "cart": {
    "line_items": [
      {
        "item": {
          "id": "variant_blue_42"
        },
        "quantity": 2
      },
      {
        "item": {
          "id": "socks_123"
        },
        "quantity": 1
      }
    ],
    "context": {
      "address_country": "SV"
    }
  }
}
```

Si un artículo existente no aparece en el nuevo `line_items`, debe considerarse eliminado del carrito. ([Universal Commerce Protocol][2])

---

## 7.4 `cancel_cart`

```json
{
  "id": "cart_abc123"
}
```

Invalida el carrito. Una consulta posterior puede devolver `not_found` o que la sesión expiró.

---

# 8. Capability: Checkout

Identificador:

```text
dev.ucp.shopping.checkout
```

Este es el núcleo de la transacción.

El checkout ya representa una intención comercial concreta:

* Productos seleccionados.
* Comprador.
* Dirección.
* Opciones de entrega.
* Descuentos.
* Totales autoritativos.
* Instrumento de pago.
* Estado de finalización.

## Operaciones

| MCP Tool            | REST                                    | Contrato                            |
| ------------------- | --------------------------------------- | ----------------------------------- |
| `create_checkout`   | `POST /checkout-sessions`               | Crea la sesión                      |
| `get_checkout`      | `GET /checkout-sessions/{id}`           | Consulta el estado                  |
| `update_checkout`   | `PUT /checkout-sessions/{id}`           | Reemplaza los datos mutables        |
| `complete_checkout` | `POST /checkout-sessions/{id}/complete` | Autoriza finalizar y crear la orden |
| `cancel_checkout`   | `POST /checkout-sessions/{id}/cancel`   | Cancela el checkout                 |

Estos son los cinco tools obligatorios del binding MCP de checkout. ([Universal Commerce Protocol][5])

---

# 9. Estructura de un Checkout

Ejemplo simplificado:

```json
{
  "ucp": {
    "version": "2026-04-08"
  },
  "id": "checkout_123",
  "status": "incomplete",
  "line_items": [
    {
      "id": "line_1",
      "item": {
        "id": "variant_blue_42",
        "title": "Running Shoe",
        "price": 7500
      },
      "quantity": 1
    }
  ],
  "buyer": {
    "email": "buyer@example.com"
  },
  "currency": "USD",
  "totals": [
    {
      "type": "subtotal",
      "amount": 7500
    },
    {
      "type": "shipping",
      "amount": 500
    },
    {
      "type": "tax",
      "amount": 1040
    },
    {
      "type": "total",
      "amount": 9040
    }
  ],
  "status": "ready_for_complete",
  "links": [],
  "payment": {
    "instruments": []
  },
  "expires_at": "2026-07-04T22:00:00Z"
}
```

Campos principales:

| Campo          | Función                                           |
| -------------- | ------------------------------------------------- |
| `id`           | Identificador del checkout                        |
| `line_items`   | Productos y cantidades                            |
| `buyer`        | Datos del comprador                               |
| `context`      | Información contextual                            |
| `signals`      | Señales del entorno                               |
| `attribution`  | Atribución comercial                              |
| `status`       | Estado del checkout                               |
| `currency`     | Moneda ISO 4217                                   |
| `totals`       | Subtotal, descuentos, envío, impuestos y total    |
| `messages`     | Errores, advertencias o solicitudes               |
| `links`        | Políticas o enlaces relacionados                  |
| `continue_url` | Handoff hacia interfaz controlada por el comercio |
| `payment`      | Instrumentos presentados                          |
| `order`        | Referencia de orden después de completar          |
| `expires_at`   | Expiración                                        |

---

# 10. Estados del checkout

```text
                   ┌─────────────────────┐
                   │     incomplete      │
                   └──────────┬──────────┘
                              │ datos suficientes
                              ▼
                   ┌─────────────────────┐
              ┌───▶│ ready_for_complete  │
              │    └──────────┬──────────┘
              │               │ complete_checkout
              │               ▼
┌─────────────────────┐  ┌─────────────────────┐
│ requires_escalation │  │ complete_in_progress│
└──────────┬──────────┘  └──────────┬──────────┘
           │ vuelve del handoff      │
           └─────────────────────────┤
                                     ▼
                          ┌─────────────────────┐
                          │      completed      │
                          └─────────────────────┘

Desde estados no terminales:
                  cancel_checkout
                         ↓
                    canceled
```

## `incomplete`

Falta algo:

* Dirección.
* Email.
* Opción de entrega.
* Consentimiento.
* Corrección de inventario.
* Selección de variante.

## `requires_escalation`

La operación debe continuar en una interfaz del comercio.

Ejemplos:

* 3-D Secure.
* Configurador complejo.
* Revisión legal.
* Selección no representable por el agente.
* Pago que exige interacción humana.

En ese estado debe proporcionarse una `continue_url`.

## `ready_for_complete`

El checkout tiene información suficiente para intentar crear la orden.

No significa que el pago ya esté confirmado.

## `complete_in_progress`

El comercio aceptó la solicitud, pero la finalización sigue en proceso.

Puede ocurrir con:

* Pagos asíncronos.
* Validación externa.
* Procesamiento prolongado.

## `completed`

La orden fue creada. El checkout se vuelve esencialmente inmutable.

## `canceled`

La sesión fue cancelada y ya no debe completarse.

---

# 11. `create_checkout`

Entrada mínima:

```json
{
  "checkout": {
    "line_items": [
      {
        "item": {
          "id": "variant_blue_42"
        },
        "quantity": 1
      }
    ],
    "context": {
      "address_country": "SV"
    }
  }
}
```

También puede incluir extensiones negociadas:

```json
{
  "checkout": {
    "line_items": [],
    "dev.ucp.shopping.fulfillment": {},
    "dev.ucp.shopping.discount": {},
    "dev.ucp.shopping.buyer_consent": {},
    "dev.ucp.shopping.ap2_mandate": {}
  }
}
```

El binding MCP contempla expresamente extensiones de buyer consent, fulfillment, discount y AP2 dentro del objeto checkout. ([Universal Commerce Protocol][5])

La respuesta siempre debe ser el checkout completo calculado por el comercio, no un eco de la entrada.

---

# 12. `get_checkout`

Entrada:

```json
{
  "id": "checkout_123"
}
```

Salida: snapshot completo actual.

Un agente puede utilizarlo para:

* Recuperar una sesión.
* Consultar un pago asíncrono.
* Comprobar si el checkout expiró.
* Reanudar después de `continue_url`.
* Ver si ya existe una orden.

---

# 13. `update_checkout`

Entrada:

```json
{
  "id": "checkout_123",
  "checkout": {
    "line_items": [
      {
        "item": {
          "id": "variant_blue_42"
        },
        "quantity": 1
      }
    ],
    "buyer": {
      "email": "buyer@example.com"
    },
    "dev.ucp.shopping.fulfillment": {
      "shipping_address": {
        "address_line_1": "Calle principal",
        "locality": "San Salvador",
        "country": "SV"
      },
      "selected_option_id": "standard_shipping"
    }
  }
}
```

Al igual que con el carrito, se utiliza semántica de reemplazo completo sobre los campos mutables. El comercio debe:

1. Revalidar inventario.
2. Recalcular precios.
3. Recalcular impuestos.
4. Recalcular entrega.
5. Aplicar descuentos.
6. Devolver el checkout completo actualizado.

El agente nunca debe modificar localmente el total y asumir que es válido.

---

# 14. Payment handlers

Este punto es fundamental:

> UCP no define un único endpoint universal llamado `pay()`.

El comercio y la plataforma negocian uno o varios **payment handlers**.

El handler define:

* Qué instrumento soporta.
* Cómo se obtiene una credencial.
* Qué esquema posee esa credencial.
* Cómo se vincula al checkout.
* Cómo la procesa el comercio.
* Si existen tokenización y detokenización.

Dentro del checkout, el agente presenta algo similar a:

```json
{
  "payment": {
    "instruments": [
      {
        "id": "instrument_1",
        "handler_id": "com.openmerchant.tokenized_card",
        "type": "card",
        "credential": {
          "token": "tok_secure_abc",
          "binding": {
            "checkout_id": "checkout_123"
          }
        },
        "billing_address": {
          "country": "SV"
        },
        "selected": true
      }
    ]
  }
}
```

Campos del instrumento:

| Campo             | Función                           |
| ----------------- | --------------------------------- |
| `id`              | ID asignado por la plataforma     |
| `handler_id`      | Handler negociado                 |
| `type`            | Tipo del instrumento              |
| `credential`      | Credencial específica del handler |
| `billing_address` | Dirección de facturación          |
| `display`         | Datos seguros de presentación     |
| `selected`        | Instrumento seleccionado          |

La credencial puede estar vinculada criptográficamente al `checkout_id` para impedir que un token interceptado se reutilice en otro checkout o comercio. ([Universal Commerce Protocol][6])

---

# 15. `complete_checkout`

Esta es la operación crítica.

No significa solamente “el agente terminó de llenar el formulario”. Significa:

> “Con estos datos, esta autorización y este instrumento de pago, intenta finalizar la transacción y crear la orden.”

## MCP

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "complete_checkout",
    "arguments": {
      "meta": {
        "ucp-agent": {
          "profile": "https://agent.example/.well-known/ucp"
        },
        "idempotency-key": "c42822a6-12f9-4747-a4d8-d5e8d13275b2"
      },
      "id": "checkout_123",
      "checkout": {
        "payment": {
          "instruments": [
            {
              "id": "instrument_1",
              "handler_id": "com.openmerchant.tokenized_card",
              "type": "card",
              "credential": {
                "token": "tok_secure_abc"
              },
              "selected": true
            }
          ]
        }
      }
    }
  }
}
```

En MCP, la operación se expone mediante `tools/call`; `id`, `meta` y `checkout` corresponden respectivamente al recurso, metadatos y payload de dominio. `complete_checkout` y `cancel_checkout` requieren clave de idempotencia para protección frente a reintentos. ([Universal Commerce Protocol][5])

## REST

```http
POST /checkout-sessions/checkout_123/complete
UCP-Agent: profile="https://agent.example/.well-known/ucp"
Idempotency-Key: c42822a6-12f9-4747-a4d8-d5e8d13275b2
Content-Type: application/json
```

```json
{
  "payment": {
    "instruments": [
      {
        "id": "instrument_1",
        "handler_id": "com.openmerchant.tokenized_card",
        "type": "card",
        "credential": {
          "token": "tok_secure_abc"
        },
        "selected": true
      }
    ]
  }
}
```

Las operaciones mutables deben ser idempotentes. Cuando el servidor acepta una `Idempotency-Key`, debe conservar el resultado durante al menos 24 horas, devolver el resultado almacenado ante un reintento idéntico y responder `409` si la misma clave se reutiliza con parámetros diferentes. ([Universal Commerce Protocol][7])

---

# 16. Qué hace internamente el comercio al completar

El comercio debe ejecutar de manera determinista:

```text
1. Recuperar checkout
2. Verificar que no esté expirado/completado/cancelado
3. Verificar identidad y permisos del agente
4. Revalidar line items
5. Revalidar inventario
6. Recalcular total
7. Validar fulfillment
8. Validar descuentos y consentimiento
9. Validar payment handler
10. Verificar la credencial de pago
11. Autorizar/capturar el pago
12. Crear la orden
13. Confirmar o reservar inventario
14. Devolver checkout completed + referencia de orden
```

Respuesta:

```json
{
  "ucp": {
    "version": "2026-04-08",
    "status": "success"
  },
  "id": "checkout_123",
  "status": "completed",
  "line_items": [],
  "currency": "USD",
  "totals": [
    {
      "type": "total",
      "amount": 9040
    }
  ],
  "order": {
    "id": "order_789",
    "label": "Order #1007",
    "permalink_url": "https://shop.example/orders/order_789"
  }
}
```

La referencia devuelta durante checkout es resumida. El detalle completo se obtiene mediante la capability Order.

---

# 17. `cancel_checkout`

Entrada:

```json
{
  "id": "checkout_123"
}
```

Salida:

```json
{
  "ucp": {
    "version": "2026-04-08"
  },
  "id": "checkout_123",
  "status": "canceled"
}
```

No debe utilizarse para cancelar una orden ya creada. Una vez completado el checkout, cualquier cancelación, devolución o reembolso pertenece al ciclo posventa de la orden.

---

# 18. Capability: Order

Identificador:

```text
dev.ucp.shopping.order
```

La versión estable define una operación de lectura:

| MCP Tool    | REST               |
| ----------- | ------------------ |
| `get_order` | `GET /orders/{id}` |

No hay un conjunto genérico obligatorio como:

```text
refund_order
cancel_order
return_item
```

En la especificación base estable, esas modificaciones se representan mediante el estado del comercio, la experiencia enlazada por `permalink_url` y los `adjustments` que aparecen en snapshots posteriores. ([Universal Commerce Protocol][8])

---

## 18.1 `get_order`

Entrada:

```json
{
  "id": "order_789"
}
```

Salida:

```json
{
  "ucp": {
    "version": "2026-04-08"
  },
  "id": "order_789",
  "label": "Order #1007",
  "checkout_id": "checkout_123",
  "permalink_url": "https://shop.example/orders/order_789",
  "line_items": [
    {
      "id": "order_line_1",
      "item": {
        "id": "variant_blue_42",
        "title": "Running Shoe"
      },
      "quantity": 1
    }
  ],
  "fulfillment": {
    "expectations": [
      {
        "type": "delivery",
        "estimated_delivery": "2026-07-08"
      }
    ],
    "events": [
      {
        "type": "confirmed",
        "occurred_at": "2026-07-04T17:10:00Z"
      }
    ]
  },
  "adjustments": [],
  "currency": "USD",
  "totals": [
    {
      "type": "total",
      "amount": 9040
    }
  ]
}
```

## `fulfillment`

Representa:

* Qué prometió el comercio.
* Cómo se cumplirá.
* Eventos de preparación, envío y entrega.

## `adjustments`

Representa eventos económicos o comerciales posteriores:

* Reembolso.
* Devolución.
* Crédito.
* Disputa.
* Cancelación.
* Ajuste de precio.

---

# 19. Webhooks de órdenes

La plataforma puede declarar en su propio perfil:

```json
{
  "capabilities": {
    "dev.ucp.shopping.order": [
      {
        "version": "2026-04-08",
        "config": {
          "webhook_url": "https://agent.example/webhooks/ucp/orders"
        }
      }
    ]
  }
}
```

Cuando cambia la orden, el comercio envía un snapshot completo:

```http
POST /webhooks/ucp/orders
Webhook-Id: evt_123
Webhook-Timestamp: 1783185000
UCP-Agent: profile="https://shop.example/.well-known/ucp"
Content-Digest: sha-256=:...:
Signature-Input: sig1=(...);keyid="merchant-key-2026"
Signature: sig1=:...:
```

```json
{
  "ucp": {
    "version": "2026-04-08"
  },
  "id": "order_789",
  "checkout_id": "checkout_123",
  "line_items": [],
  "fulfillment": {
    "events": [
      {
        "type": "shipped",
        "occurred_at": "2026-07-05T14:30:00Z"
      }
    ]
  },
  "adjustments": [],
  "currency": "USD",
  "totals": []
}
```

Los webhooks contienen el **estado completo actual**, no solo un delta. Deben estar firmados por el comercio, y la plataforma debe comprobar tanto la firma como que ese comercio es realmente el propietario de la orden referenciada. ([Universal Commerce Protocol][8])

---

# 20. Identity Linking

Identificador:

```text
dev.ucp.common.identity_linking
```

Esta capability permite vincular la cuenta del comprador en la plataforma con su cuenta en el comercio.

Utiliza OAuth 2.0 Authorization Code con PKCE.

Puede habilitar:

* Direcciones guardadas.
* Historial de compras.
* Precios personalizados.
* Programa de fidelidad.
* Métodos de entrega preferidos.
* Gestión autenticada de órdenes.

Scopes posibles:

```text
dev.ucp.shopping.cart:manage
dev.ucp.shopping.checkout:manage
dev.ucp.shopping.order:read
```

No es otro tool comercial. La plataforma descubre los endpoints OAuth mediante el documento de autorización del comercio y obtiene un access token que luego envía en las operaciones UCP. ([Universal Commerce Protocol][9])

---

# 21. Extensiones de checkout

UCP mantiene un núcleo relativamente pequeño y utiliza extensiones.

## Fulfillment

```text
dev.ucp.shopping.fulfillment
```

Añade:

* Dirección.
* Opciones de envío.
* Recogida.
* Selección de fulfillment.
* Promesas de entrega.

## Discounts

```text
dev.ucp.shopping.discount
```

Añade:

* Códigos promocionales.
* Descuentos aplicados.
* Rechazo de cupones.
* Ajustes al total.

## Buyer consent

```text
dev.ucp.shopping.buyer_consent
```

Permite representar consentimientos y aceptación de términos.

## AP2 mandates

```text
dev.ucp.shopping.ap2_mandate
```

Añade pruebas criptográficas de:

* Qué carrito fue aceptado.
* Qué importe fue autorizado.
* Qué instrumento puede utilizarse.
* Qué delegación recibió el agente.

Las extensiones no necesariamente crean nuevas herramientas MCP. Normalmente añaden campos negociados a `create_checkout`, `update_checkout` y `complete_checkout`. ([Universal Commerce Protocol][5])

---

# 22. Interacción humana frente a compra autónoma

En UCP convencional, el agente puede construir el checkout, pero la revisión final suele ocurrir en una interfaz determinista y confiable:

```text
Agente prepara checkout
        ↓
Comercio devuelve continue_url
        ↓
Usuario revisa y autoriza
        ↓
Comercio procesa
```

Con una extensión como AP2:

```text
Usuario firma mandato
        ↓
Agente recibe autorización limitada
        ↓
complete_checkout incluye mandato
        ↓
Comercio verifica el mandato
        ↓
Procesa sin nueva interacción
```

Por tanto, UCP no implica automáticamente que todo agente pueda gastar de forma autónoma. La autonomía depende de:

* Payment handler.
* Identidad.
* Consentimiento.
* Mandatos.
* Políticas del comercio.
* Capacidades negociadas.

---

# 23. Ciclo de vida completo de una transacción

## Fase 1: descubrimiento

```text
Platform → Business
GET /.well-known/ucp
```

Resultado:

* Versión.
* Endpoint REST/MCP.
* Capacidades.
* Payment handlers.
* Claves públicas.

## Fase 2: negociación

```text
Capacidades plataforma:
Catalog + Cart + Checkout + Order + Card Handler

Capacidades comercio:
Catalog + Checkout + Order + Card Handler

Capacidades activas:
Catalog + Checkout + Order + Card Handler
```

El carrito no se utiliza porque no pertenece a la intersección.

## Fase 3: identidad opcional

```text
OAuth Authorization Code + PKCE
→ access token del comprador
```

## Fase 4: descubrimiento del producto

```text
search_catalog
→ resultados
```

## Fase 5: detalle

```text
get_product(product_id, selections)
→ variante, precio y disponibilidad
```

## Fase 6: carrito opcional

```text
create_cart
update_cart
get_cart
```

Puede omitirse y pasar directamente al checkout.

## Fase 7: creación del checkout

```text
create_checkout(line_items, context)
```

El comercio devuelve:

```text
status = incomplete
messages = falta dirección
```

## Fase 8: completar datos

```text
update_checkout(
  buyer,
  shipping_address,
  fulfillment_option,
  discount_code
)
```

El comercio recalcula:

* Precio.
* Impuesto.
* Descuento.
* Entrega.
* Total.

## Fase 9: checkout listo

```text
status = ready_for_complete
total = $90.40
```

## Fase 10: conseguir la credencial de pago

La plataforma llama al payment handler negociado:

```text
Card vault / wallet / issuer
→ token ligado a checkout_123
```

El LLM solo conoce:

```json
{
  "instrument_reference": "instrument_1",
  "authorized_amount": 9040
}
```

No necesita conocer PAN, CVV ni secretos.

## Fase 11: autorización final

Una de dos:

```text
A. Usuario revisa interfaz determinista
B. El agente presenta mandato AP2 válido
```

## Fase 12: completar

```text
complete_checkout(
  checkout_123,
  payment_instrument,
  idempotency_key
)
```

## Fase 13: ejecución del comercio

```text
Validar checkout
→ revalidar inventario
→ validar precio
→ procesar pago
→ crear orden
→ confirmar inventario
```

## Fase 14: respuesta

```text
checkout.status = completed
checkout.order.id = order_789
```

## Fase 15: seguimiento

```text
get_order(order_789)
```

o:

```text
Business → webhook → Platform
```

## Fase 16: posventa

Los snapshots de la orden se actualizan con:

```text
fulfillment.events:
confirmed → processing → shipped → delivered

adjustments:
refund → return → dispute → cancellation
```

---

# 24. Diagrama de secuencia completo

```text
Buyer        Agent/Platform       Business UCP       Payment Handler       PSP
  │                │                    │                    │               │
  │ Comprar        │                    │                    │               │
  ├───────────────▶│                    │                    │               │
  │                │ GET /.well-known   │                    │               │
  │                ├───────────────────▶│                    │               │
  │                │ profile            │                    │               │
  │                │◀───────────────────┤                    │               │
  │                │                    │                    │               │
  │                │ search_catalog     │                    │               │
  │                ├───────────────────▶│                    │               │
  │                │ products           │                    │               │
  │                │◀───────────────────┤                    │               │
  │                │                    │                    │               │
  │                │ get_product        │                    │               │
  │                ├───────────────────▶│                    │               │
  │                │ current product    │                    │               │
  │                │◀───────────────────┤                    │               │
  │                │                    │                    │               │
  │                │ create_checkout    │                    │               │
  │                ├───────────────────▶│                    │               │
  │                │ incomplete         │                    │               │
  │                │◀───────────────────┤                    │               │
  │                │                    │                    │               │
  │ Dirección      │                    │                    │               │
  ├───────────────▶│ update_checkout    │                    │               │
  │                ├───────────────────▶│                    │               │
  │                │ ready_for_complete │                    │               │
  │                │◀───────────────────┤                    │               │
  │                │                    │                    │               │
  │ Autorizar      │ acquire credential │                    │               │
  ├───────────────▶├────────────────────────────────────────▶│               │
  │                │ token              │                    │               │
  │                │◀────────────────────────────────────────┤               │
  │                │                    │                    │               │
  │                │ complete_checkout  │                    │               │
  │                ├───────────────────▶│ process credential │               │
  │                │                    ├───────────────────▶│ authorize     │
  │                │                    │                    ├──────────────▶│
  │                │                    │                    │ approved      │
  │                │                    │                    │◀──────────────┤
  │                │                    │ result             │               │
  │                │                    │◀───────────────────┤               │
  │                │ completed + order  │                    │               │
  │                │◀───────────────────┤                    │               │
  │ Confirmación   │                    │                    │               │
  │◀───────────────┤                    │                    │               │
  │                │                    │                    │               │
  │                │    signed order webhook                 │               │
  │                │◀───────────────────┤                    │               │
```

---

# 25. Lista completa de tools MCP principales

Para una implementación de compras general, el servidor MCP expondría:

```text
Catalog
├── search_catalog
├── lookup_catalog
└── get_product

Cart
├── create_cart
├── get_cart
├── update_cart
└── cancel_cart

Checkout
├── create_checkout
├── get_checkout
├── update_checkout
├── complete_checkout
└── cancel_checkout

Order
└── get_order
```

No todos son obligatorios globalmente. Solo son obligatorios dentro de una capability que el comercio haya anunciado como compatible.

---

# 26. Para la arquitectura que están diseñando

Su núcleo interno debería implementar estas operaciones canónicas:

```typescript
interface CommerceCore {
  searchCatalog(input: SearchCatalogInput): Promise<SearchCatalogResult>;
  lookupCatalog(input: LookupCatalogInput): Promise<LookupCatalogResult>;
  getProduct(input: GetProductInput): Promise<GetProductResult>;

  createCart(input: CreateCartInput): Promise<Cart>;
  getCart(id: string): Promise<Cart>;
  updateCart(id: string, input: ReplaceCartInput): Promise<Cart>;
  cancelCart(id: string): Promise<Cart>;

  createCheckout(input: CreateCheckoutInput): Promise<Checkout>;
  getCheckout(id: string): Promise<Checkout>;
  updateCheckout(
    id: string,
    input: ReplaceCheckoutInput
  ): Promise<Checkout>;
  completeCheckout(
    id: string,
    input: CompleteCheckoutInput,
    idempotencyKey: string
  ): Promise<Checkout>;
  cancelCheckout(
    id: string,
    idempotencyKey: string
  ): Promise<Checkout>;

  getOrder(id: string): Promise<Order>;
}
```

Y encima:

```text
CommerceCore
├── REST UCP adapter
├── MCP UCP adapter
├── A2A adapter
└── Embedded checkout adapter
```

Así, MCP no “implementa internamente REST”. Ambos bindings llaman el mismo núcleo comercial y devuelven exactamente el mismo estado autoritativo.

[1]: https://ucp.dev/2026-04-08/specification/overview/?utm_source=chatgpt.com "Overview - Universal Commerce Protocol (UCP)"
[2]: https://ucp.dev/2026-04-08/specification/cart-mcp/ "MCP - Universal Commerce Protocol (UCP)"
[3]: https://ucp.dev/latest/specification/catalog/mcp/ "MCP - Universal Commerce Protocol (UCP)"
[4]: https://ucp.dev/latest/specification/catalog/rest/?utm_source=chatgpt.com "REST - Universal Commerce Protocol (UCP)"
[5]: https://ucp.dev/2026-04-08/specification/checkout-mcp/ "MCP - Universal Commerce Protocol (UCP)"
[6]: https://ucp.dev/2026-04-08/specification/reference/?utm_source=chatgpt.com "Reference - Universal Commerce Protocol (UCP)"
[7]: https://ucp.dev/2026-04-08/specification/checkout-rest/ "REST - Universal Commerce Protocol (UCP)"
[8]: https://ucp.dev/2026-04-08/specification/order/ "Overview - Universal Commerce Protocol (UCP)"
[9]: https://ucp.dev/2026-04-08/specification/identity-linking/ "Identity Linking Capability - Universal Commerce Protocol (UCP)"



#Ultimo
## Parcialmente

Los **cinco endpoints de checkout sí coinciden exactamente** con el binding REST oficial de UCP:

| Método | Endpoint                           | Estado   |
| ------ | ---------------------------------- | -------- |
| `POST` | `/checkout-sessions`               | Correcto |
| `GET`  | `/checkout-sessions/{id}`          | Correcto |
| `PUT`  | `/checkout-sessions/{id}`          | Correcto |
| `POST` | `/checkout-sessions/{id}/complete` | Correcto |
| `POST` | `/checkout-sessions/{id}/cancel`   | Correcto |

UCP define precisamente esas cinco operaciones para Checkout. ([Universal Commerce Protocol][1])

### El prefijo `/ucp/v1` es válido

Los endpoints son relativos al `endpoint` publicado por el comercio en:

```text
/.well-known/ucp
```

Por ejemplo, el perfil puede anunciar:

```text
endpoint: https://tienda.com/ucp/v1
```

Y las operaciones quedarían bajo:

```text
https://tienda.com/ucp/v1/checkout-sessions
```

La especificación permite que cada comercio anuncie su URL base mediante el perfil de descubrimiento. ([Universal Commerce Protocol][1])

---

# Lo que no coincide

Este endpoint:

```text
GET /ucp/v1/products
```

**no corresponde al binding REST actual de Catalog UCP**.

La especificación `2026-04-08` define:

| Método | Endpoint           | Operación                         |
| ------ | ------------------ | --------------------------------- |
| `POST` | `/catalog/search`  | Buscar productos                  |
| `POST` | `/catalog/lookup`  | Obtener varios productos por ID   |
| `POST` | `/catalog/product` | Obtener el detalle de un producto |

([Universal Commerce Protocol][2])

Puedes conservar `GET /products` como endpoint propio o feed interno, pero no deberías anunciarlo como una operación estándar UCP.

---

# Especificación mínima corregida

Todos relativos al prefijo `/ucp/v1`:

| Método | Ruta                               | Operación UCP     |
| ------ | ---------------------------------- | ----------------- |
| `POST` | `/catalog/search`                  | Search Catalog    |
| `POST` | `/catalog/lookup`                  | Lookup Catalog    |
| `POST` | `/catalog/product`                 | Get Product       |
| `POST` | `/checkout-sessions`               | Create Checkout   |
| `GET`  | `/checkout-sessions/{id}`          | Get Checkout      |
| `PUT`  | `/checkout-sessions/{id}`          | Update Checkout   |
| `POST` | `/checkout-sessions/{id}/complete` | Complete Checkout |
| `POST` | `/checkout-sessions/{id}/cancel`   | Cancel Checkout   |
| `GET`  | `/orders/{id}`                     | Get Order         |

`GET /orders/{id}` es necesario únicamente si el comercio anuncia la capability `dev.ucp.shopping.order`. ([Universal Commerce Protocol][3])

También necesitan publicar:

```text
GET /.well-known/ucp
```

Ese perfil declara:

* URL base `/ucp/v1`.
* Versión UCP.
* Transporte REST.
* Capabilities implementadas.
* Payment handlers disponibles.

---

# Para ser realmente conforme

Tener las rutas correctas no es suficiente. También deben respetar:

* Esquemas oficiales de entrada y salida.
* Importes en unidades menores.
* Respuesta con metadata `ucp`.
* Header `UCP-Agent`.
* Header `Request-Id`.
* Idempotencia en operaciones mutables.
* Errores comerciales dentro de `messages`.
* HTTPS; la especificación vigente requiere TLS 1.3 para estos endpoints. ([Universal Commerce Protocol][1])

**Conclusión:** el checkout está bien diseñado; solamente deben reemplazar `GET /products` por las operaciones oficiales de Catalog y agregar descubrimiento y órdenes cuando correspondan.

[1]: https://ucp.dev/2026-04-08/specification/checkout-rest/ "REST - Universal Commerce Protocol (UCP)"
[2]: https://ucp.dev/latest/specification/catalog/rest/ "REST - Universal Commerce Protocol (UCP)"
[3]: https://ucp.dev/latest/specification/order-rest/ "REST - Universal Commerce Protocol (UCP)"