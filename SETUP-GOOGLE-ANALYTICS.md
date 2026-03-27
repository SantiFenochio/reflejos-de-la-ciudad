# 📊 Setup Google Analytics 4

## Paso 1: Crear Cuenta GA4

1. Ve a https://analytics.google.com
2. Click en "Comenzar" o "Admin" (si ya tienes cuenta)
3. Crear nueva propiedad:
   - **Nombre:** Reflejos de la Ciudad
   - **Zona horaria:** (GMT-03:00) Argentina
   - **Moneda:** Peso argentino (ARS)
4. Click "Siguiente"
5. Selecciona "Publicación y contenido" como categoría
6. Click "Crear"

## Paso 2: Configurar Flujo de Datos

1. Selecciona "Web" como plataforma
2. **URL del sitio web:** `https://reflejos-de-la-ciudad.vercel.app`
3. **Nombre del flujo:** Reflejos de la Ciudad - Producción
4. Click "Crear flujo"

## Paso 3: Copiar ID de Medición

Después de crear el flujo, verás tu **ID de medición**:
```
G-XXXXXXXXXX
```

Este es tu código único. Cópialo.

## Paso 4: Agregar a Vercel

1. Ve a https://vercel.com/dashboard
2. Selecciona el proyecto "reflejos-de-la-ciudad"
3. Ve a Settings → Environment Variables
4. Agregar nueva variable:
   - **Key:** `PUBLIC_GA_ID`
   - **Value:** `G-XXXXXXXXXX` (tu ID de medición)
   - **Environment:** Production, Preview, Development
5. Click "Save"

## Paso 5: Deploy

```bash
# Hacer commit de los cambios
git add .
git commit -m "feat: agregar Google Analytics 4"
git push

# Vercel hará deploy automáticamente
```

## Paso 6: Verificar Instalación

1. Abre tu sitio en modo incógnito
2. Ve a https://analytics.google.com
3. Ve a "Informes" → "Tiempo real"
4. Deberías ver tu visita en tiempo real

## Configuraciones Recomendadas

### A. Objetivos de Conversión

En GA4 → Admin → Eventos → Crear Evento:

1. **article_view** (ya tracked automáticamente)
2. **search** (cuando usan el buscador)
3. **newsletter_signup** (cuando se suscriben)
4. **share** (cuando comparten artículo)

### B. Audiencias

Crear audiencias útiles:
- Usuarios recurrentes (>3 visitas)
- Lectores frecuentes (>5 artículos vistos)
- Usuarios de mobile
- Usuarios de desktop

### C. Privacidad

Ya está configurado con:
- ✅ `anonymize_ip: true` (anonimiza IPs)
- ✅ `cookie_flags: 'SameSite=None;Secure'`
- ✅ Solo se carga en producción

### D. Integración con Search Console

1. Ve a GA4 → Admin → Product Links
2. Click "Search Console Links"
3. Vincular con Search Console de tu sitio

## Eventos Custom Disponibles

Ya tienes funciones helper para trackear:

```typescript
import { trackArticleView, trackSearch, trackShare } from '@/lib/analytics';

// Vista de artículo
trackArticleView(slug, category, title);

// Búsqueda
trackSearch(query, resultsCount);

// Compartir
trackShare('facebook', articleUrl);
```

## Métricas Clave a Monitorear

1. **Usuarios activos**
2. **Sesiones por usuario**
3. **Duración promedio de sesión**
4. **Páginas por sesión**
5. **Tasa de rebote**
6. **Artículos más leídos**
7. **Fuentes de tráfico** (direct, social, search)
8. **Dispositivos** (mobile vs desktop)

## Dashboard Recomendado

Crea un dashboard custom con:
- Usuarios en tiempo real
- Artículos más leídos (últimos 7 días)
- Fuentes de tráfico principales
- Conversiones (newsletter signups)
- Engagement por categoría

## Testing

Para testear eventos en desarrollo:

```bash
# 1. Agregar GA_ID temporal a .env.local
PUBLIC_GA_ID=G-XXXXXXXXXX

# 2. Cambiar condición en BaseLayout para permitir DEV
# Temporalmente cambiar:
# {import.meta.env.PROD && GA_ID && ...
# Por:
# {GA_ID && GA_ID !== 'G-XXXXXXXXXX' && ...

# 3. Correr dev server
npm run dev

# 4. Ver eventos en tiempo real en GA4
```

## Troubleshooting

### No veo datos en GA4
- Espera 24-48 horas para datos históricos
- Verifica que el ID sea correcto en Vercel
- Usa "Tiempo real" para ver datos inmediatos
- Verifica que el sitio esté en HTTPS

### AdBlockers
- ~30% de usuarios usan adblockers
- GA4 será bloqueado por muchos
- Vercel Analytics seguirá funcionando ✅

### GDPR / Cookies
- Si tienes usuarios de Europa, considera agregar cookie consent
- GA4 tiene modo "consent mode" para GDPR

## Recursos

- Documentación GA4: https://support.google.com/analytics/answer/10089681
- Google Tag Manager (opcional): https://tagmanager.google.com
- GA4 Event Builder: https://ga-dev-tools.google/ga4/event-builder

---

¡Listo! Analytics configurado correctamente. 🎉
