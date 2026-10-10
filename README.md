# 🧾 Factugrafía - Lectura de Facturas con IA (Paraguay DNIT)

Sistema moderno Full-Stack desarrollado por **[Norio](https://norioportfolio.xyz/)** con **Next.js**, **Bun**, **Tailwind CSS** y **Google Gemini Flash** y **Groq (Qwen 3.8 Vision)** para la extracción automatizada y auditoría interactiva (Human-in-the-Loop) de comprobantes fiscales de la República del Paraguay (DNIT / Marangatu / e-Kuatia).

Soporta fotos tomadas con el celular, tickets térmicos arrugados y facturas electrónicas oficiales en formato PDF (KuDE).

---

## ✨ Características Principales

* **Interfaz Split-Screen (Lado a Lado)**:
  * **Columna Izquierda (Visor Interactivo)**: Zona drag-and-drop, captura directa desde el portapapeles (**Ctrl + V**), visor de imágenes con zoom por rueda, desplazamiento (pan), rotación a 90° y visor embebido para documentos PDF.
  * **Columna Derecha (Auditoría Fiscal)**: Formulario editable en tiempo real precargado por la IA.
* **Semáforo de Validación Aritmética DNIT**:
  * Comprobación automática en tiempo real de la regla fiscal paraguaya:
    $$\text{Total General} = \text{Exentas} + \text{Gravadas 5\%} + \text{Gravadas 10\%}$$
  * Verificación de la liquidación del IVA (base 21 para el 5% y base 11 para el 10%).
* **Múltiples proveedores de IA**:
  * Selector de modelo en la cabecera: **Google Gemini** o **Groq** (Qwen 3.8 27B). Cada uno usa su propia clave en `.env`.
  * Con Groq, los **PDF se convierten automáticamente a imagen** (primeras 5 páginas) antes de enviarse, ya que Groq solo procesa imágenes.
* **Endpoint REST Externo Integrable**:
  * `/api/analizar-factura` acepta peticiones `multipart/form-data` con cabeceras **CORS** abiertas para ser consumido directamente desde ERPs, backends en Python/C#/PHP o aplicaciones móviles.
* **Tipado Estricto con Zod**:
  * Estructura garantizada para RUC con DV, Timbrado de 8 dígitos, N° de Factura (001-001-XXXXXXX), desglose tributario, tabla de ítems y Código Digital de Control (CDC de 44 dígitos).

---

## 🔑 Cómo Obtener las Claves de API (gratuitas)

Necesitas al menos una de las dos claves, según los modelos que quieras usar.

### Google Gemini → `GEMINI_API_KEY`

1. Ingresa a **[Google AI Studio – API keys](https://aistudio.google.com/apikey)** (https://aistudio.google.com/).
2. Inicia sesión con cualquier cuenta de Google.
3. Haz clic en **"Create API key"** (puedes crearla en un proyecto nuevo o existente).
4. Copia la clave generada (el nivel gratuito ofrece cuota generosa con los modelos Flash).

### Groq → `GROQ_API_KEY`

1. Ingresa a la **[consola de Groq](https://console.groq.com/)** y crea una cuenta o inicia sesión (Google, GitHub o correo).
2. En el menú lateral entra a **"API Keys"** ([console.groq.com/keys](https://console.groq.com/keys)).
3. Haz clic en **"Create API Key"**, asígnale un nombre (ej. `factugrafia`) y confirma.
4. Copia la clave (empieza con `gsk_...`). **Solo se muestra una vez**; si la pierdes, crea otra.

### Configurar el archivo `.env`

1. Crea tu archivo `.env` en la raíz del proyecto a partir de la plantilla:
   ```bash
   cp .env.example .env
   ```
2. Pega tus claves:
   ```env
   GEMINI_API_KEY=AIzaSy...tu_clave_de_gemini
   GROQ_API_KEY=gsk_...tu_clave_de_groq
   ```
   *(Nota: `.env` está ignorado en `.gitignore`, por lo que tus credenciales nunca se subirán a GitHub. Reinicia `bun run dev` después de cambiarlo.)*

---

## ⚡ Requisitos y Uso con Bun

Este proyecto utiliza **[Bun](https://bun.sh/)** como gestor de paquetes y runtime de alto rendimiento.

> Si aún no tienes Bun en Windows, puedes instalarlo desde PowerShell con:
> ```powershell
> powershell -c "irm bun.sh/install.ps1 | iex"
> ```

### 1. Instalar dependencias
```bash
bun install
```

### 2. Iniciar el servidor de desarrollo
```bash
bun run dev
```
Abre tu navegador en [http://localhost:3000](http://localhost:3000).

### 3. Compilar para producción
```bash
bun run build
```

### 4. Iniciar en modo producción
```bash
bun run start
```

---

## 🔌 Uso del Endpoint desde Otros Proyectos

El endpoint `/api/analizar-factura` puede ser invocado desde cualquier aplicación externa enviando el archivo como un adjunto multipart (`file`):

### Con cURL
```bash
curl -X POST http://localhost:3000/api/analizar-factura \
     -F "file=@mi_factura.pdf"
```

### Con JavaScript / Fetch
```javascript
const formData = new FormData();
formData.append("file", fileInput.files[0]);

const response = await fetch("http://localhost:3000/api/analizar-factura", {
  method: "POST",
  body: formData,
});

const data = await response.json();
console.log(data.factura);
```

### Con Python (requests)
```python
import requests

with open("factura.jpg", "rb") as f:
    files = {"file": f}
    response = requests.post("http://localhost:3000/api/analizar-factura", files=files)
    print(response.json())
```

---

## 📁 Estructura del Proyecto

```
factugrafia/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── analizar-factura/
│   │   │       └── route.ts        # Endpoint multipart con CORS (Gemini / Groq)
│   │   ├── layout.tsx              # Layout principal con Sonner (Toaster)
│   │   └── page.tsx                # Estación de trabajo split-screen interactiva
│   ├── components/
│   │   ├── ImageDropzone.tsx       # Drag & drop y captura de portapapeles (Ctrl+V)
│   │   ├── ImageViewer.tsx         # Visor con zoom, pan, rotación y soporte PDF
│   │   └── FacturaForm.tsx         # Formulario fiscal con validador DNIT
│   ├── lib/
│   │   ├── analizar.ts             # Selecciona proveedor (Gemini o Groq) según el modelo
│   │   ├── gemini.ts               # Cliente oficial @google/genai
│   │   ├── groq.ts                 # Cliente Groq (API compatible con OpenAI)
│   │   ├── modelos.ts              # Catálogo de modelos y proveedores
│   │   ├── pdf-a-imagenes.ts       # PDF → PNG para modelos que solo aceptan imágenes
│   │   └── prompt.ts               # Prompt del sistema y validación de la respuesta
│   └── types/
│       └── factura.ts              # Esquema Zod y lógica de cálculo fiscal
├── .env.example                    # Plantilla de variables de entorno
├── .env                            # Claves locales privadas (ignorado en git)
└── package.json
```

---

## 👨‍💻 Autor y Desarrollo

Desarrollado con dedicación por **[Norio](https://norioportfolio.xyz/)**.

🌐 Portafolio: [https://norioportfolio.xyz/](https://norioportfolio.xyz/)

---

## 📄 Licencia

MIT
