# Etapa 1: Compilación del frontend con Node.js
FROM node:20-alpine AS builder

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos necesarios para instalar dependencias
COPY package*.json ./

# Instala las dependencias con npm limpio
RUN npm ci

# Copia el resto del proyecto
COPY . .

# Compila el proyecto en modo producción
RUN npm install -g @ionic/cli && ionic build --configuration=development


# Etapa 2: Servir con Nginx
FROM nginx:1.25-alpine

# Limpia el contenido HTML por defecto
RUN rm -rf /usr/share/nginx/html/*

# Copia los archivos compilados desde la etapa anterior
COPY --from=builder /app/www /usr/share/nginx/html

# Copia configuración de Nginx personalizada
COPY nginx.conf /etc/nginx/nginx.conf

# Expone el puerto 80 (HTTP)
EXPOSE 80

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]
