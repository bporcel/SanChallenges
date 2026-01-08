# Requirements

## Requisitos funcionales
- Crear reto compartido
- Generar código/enlace de invitación
- Unirse a reto existente
- Check diario por usuario
- Deshacer check diario
- Crear reto de largo plazo (goal-based)
- Marcar reto de largo plazo como completado
- Nudge diario opcional para retos de largo plazo (sin penalizaciones)
- Ranking por reto
- Eliminar reto
- Nombre de usuario editable
- Retos privados (solo creador puede marcar)
- Sistema de Aura global (reputación visual basada en consistencia)
- Configuración de duración del reto (en días)
- Estadísticas personales anuales (retos, checks, aura)

## Requisitos no funcionales
- Sin login
- Sin costes
- Sincronización online básica
- Manejo de conflictos simple (last write wins)

## Reglas de negocio
- Identidad anónima generada localmente
- Un check por día y usuario (retos diarios)
- Retos de largo plazo: una sola completación por usuario
- Nudges opcionales para retos de largo plazo, no afectan ranking
- Ranking de largo plazo: completados primero, ordenados por fecha de completación
- No edición retroactiva
- Confianza total entre participantes
- Aura es global (compartida entre retos), basada en la mejor racha activa
- Aura se degrada 2 niveles al romper cualquier racha
- Aura es principalmente visual (colores, brillo, animaciones) sin números expuestos
