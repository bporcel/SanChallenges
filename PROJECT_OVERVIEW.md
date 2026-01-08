# Project Overview

## Objetivo principal
Permitir que varios usuarios compartan y sigan retos comunes desde distintas instalaciones de la app.

## Qué sí hace
- Retos compartidos online
- Invitación a retos mediante código o enlace
- Check diario por usuario
- Deshacer check diario
- Retos de largo plazo (goals que se completan una vez)
- Nudges diarios opcionales para mantener motivación (sin penalizaciones)
- Ranking por reto
- Eliminar reto
- Retos privados (solo creador puede marcar)
- Sistema de Aura global (reputación visual basada en consistencia y rachas)
- Duración de retos dinámica (configurable al crear)
- Contexto social (ver quién ha marcado hoy por nombre)
- Identidad automática estilo anime (Shadow Hokage, etc.)
- Localización completa (EN/ES) con detección automática
- Tendencia de ranking robusta (subidas/bajadas calculadas en servidor)
- Estadísticas personales anuales (reflejaón y motivación)

## Qué no hace
- Login o autenticación formal
- Perfiles complejos
- Chat o notificaciones
- Validación automática

## Flujo general

### Retos diarios
1. Usuario crea reto diario
2. Genera código de invitación
3. Amigos se unen al reto
4. Cada usuario marca su check diario
5. Ranking se actualiza

### Retos de largo plazo
1. Usuario crea reto de largo plazo (goal)
2. Genera código de invitación
3. Amigos se unen al reto
4. Usuarios trabajan en el objetivo (pueden marcar nudges opcionales)
5. Usuario marca como completado cuando alcanza el objetivo
6. Ranking muestra usuarios completados primero

## Prioridades
1. Simplicidad
2. Velocidad
3. Sin fricción
