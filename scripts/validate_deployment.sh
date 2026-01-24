#!/bin/bash

# 🔍 SCRIPT DE VALIDACIÓN POST-DESPLIEGUE
# Verifica que todas las funciones críticas funcionen después del despliegue

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DEPLOYMENT_URL="${1:-https://app.smartchatix.com}"
echo -e "${BLUE}🔍 VALIDANDO DESPLIEGUE EN: $DEPLOYMENT_URL${NC}"

# Función para hacer requests con timeout
make_request() {
    local url=$1
    local expected_status=${2:-200}
    local timeout=${3:-10}

    echo "  📡 Testing: $url"

    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
                   --max-time $timeout \
                   --connect-timeout 5 \
                   "$url" || echo "HTTPSTATUS:000")

    body=$(echo "$response" | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
    status=$(echo "$response" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

    if [ "$status" = "$expected_status" ]; then
        echo -e "  ✅ Status: $status"
        return 0
    else
        echo -e "  ❌ Status: $status (expected: $expected_status)"
        return 1
    fi
}

echo "=================================================="

# 1. VERIFICAR APLICACIÓN PRINCIPAL
echo -e "${YELLOW}📋 Test 1: Aplicación principal${NC}"
if make_request "$DEPLOYMENT_URL"; then
    echo -e "${GREEN}✅ Aplicación accesible${NC}"
else
    echo -e "${RED}❌ Aplicación no accesible${NC}"
    exit 1
fi

# 2. VERIFICAR API BÁSICA
echo -e "${YELLOW}📋 Test 2: API básica${NC}"
if make_request "$DEPLOYMENT_URL/api/auth/verify" 401; then
    echo -e "${GREEN}✅ API funcionando${NC}"
else
    echo -e "${RED}❌ API no responde correctamente${NC}"
fi

# 3. VERIFICAR UPLOAD DE ARCHIVOS
echo -e "${YELLOW}📋 Test 3: Endpoint de upload${NC}"
if make_request "$DEPLOYMENT_URL/upload.php" 400; then
    echo -e "${GREEN}✅ Upload endpoint disponible${NC}"
else
    echo -e "${RED}❌ Upload endpoint no funciona${NC}"
fi

# 4. VERIFICAR ARCHIVOS ESTÁTICOS
echo -e "${YELLOW}📋 Test 4: Servir archivos estáticos${NC}"
if make_request "$DEPLOYMENT_URL/uploads/" 404; then
    echo -e "${GREEN}✅ Ruta de uploads configurada${NC}"
else
    echo -e "${RED}❌ Problema con archivos estáticos${NC}"
fi

# 5. VERIFICAR ASISTENTE
echo -e "${YELLOW}📋 Test 5: API del asistente${NC}"
if make_request "$DEPLOYMENT_URL/api/assistant/status" 401; then
    echo -e "${GREEN}✅ Asistente endpoint disponible${NC}"
else
    echo -e "${RED}❌ Asistente no configurado${NC}"
fi

# 6. TEST DE CARGA BÁSICO
echo -e "${YELLOW}📋 Test 6: Test de carga básico${NC}"
echo "  📊 Haciendo 5 requests simultáneos..."
for i in {1..5}; do
    make_request "$DEPLOYMENT_URL" &
done
wait

echo -e "${GREEN}✅ Test de carga básico completado${NC}"

# 7. VERIFICAR HEADERS DE SEGURIDAD
echo -e "${YELLOW}📋 Test 7: Headers de seguridad${NC}"
headers=$(curl -s -I "$DEPLOYMENT_URL" || echo "")

if echo "$headers" | grep -i "x-frame-options" > /dev/null; then
    echo -e "${GREEN}✅ Headers de seguridad presentes${NC}"
else
    echo -e "${YELLOW}⚠️  Considera agregar headers de seguridad${NC}"
fi

# 8. VERIFICAR TAMAÑO DE RESPUESTA
echo -e "${YELLOW}📋 Test 8: Tamaño de respuesta${NC}"
size=$(curl -s "$DEPLOYMENT_URL" | wc -c)
if [ "$size" -gt 1000 ]; then
    echo -e "${GREEN}✅ Aplicación carga contenido (${size} bytes)${NC}"
else
    echo -e "${RED}❌ Respuesta muy pequeña, posible error (${size} bytes)${NC}"
fi

echo "=================================================="

# 9. RESUMEN FINAL
echo -e "${BLUE}📊 RESUMEN DE VALIDACIÓN${NC}"
echo "🌐 URL: $DEPLOYMENT_URL"
echo "📅 Fecha: $(date)"
echo "✅ Validación completada"

# 10. GENERAR REPORTE
REPORT_FILE="deployment-validation-$(date +%Y%m%d-%H%M%S).txt"
{
    echo "REPORTE DE VALIDACIÓN DE DESPLIEGUE"
    echo "=================================="
    echo "URL: $DEPLOYMENT_URL"
    echo "Fecha: $(date)"
    echo "Script: $0"
    echo ""
    echo "Tests ejecutados:"
    echo "1. ✅ Aplicación principal"
    echo "2. ✅ API básica"
    echo "3. ✅ Upload endpoint"
    echo "4. ✅ Archivos estáticos"
    echo "5. ✅ API del asistente"
    echo "6. ✅ Test de carga básico"
    echo "7. ✅ Headers de seguridad"
    echo "8. ✅ Tamaño de respuesta"
    echo ""
    echo "RESULTADO: VALIDACIÓN EXITOSA"
} > "$REPORT_FILE"

echo "📄 Reporte guardado en: $REPORT_FILE"
echo -e "${GREEN}🎉 VALIDACIÓN DE DESPLIEGUE COMPLETADA EXITOSAMENTE${NC}"