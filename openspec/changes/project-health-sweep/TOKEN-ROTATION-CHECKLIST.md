# Token Rotation Checklist — M1 Phase 3 (USER-OWNED)

**Cuándo ejecutar esto:** cuando el API owner emita un nuevo `VITE_API_TOKEN`.

**Pre-requisitos:**
- [ ] Nuevo token recibido del API owner (guardar en nota segura, NO en el repo)
- [ ] `git filter-repo` instalado (si no: `pip install git-filter-repo` o descargar exe de https://github.com/newren/git-filter-repo/releases o usar fallback `git filter-branch`)

## Paso 1 — Backup branch
```bash
git checkout main
git pull  # si hay cambios remotos
git branch pre-m1-backup
```

## Paso 2 — Purge credencial del historial Git
```bash
git filter-repo --invert-paths --path .env --path .env.example --force
```
Si no tenés `git filter-repo`:
```bash
# Opción A (fallback bundled con Git):
git filter-branch --index-filter 'git rm --cached --ignore-unmatch .env .env.example' -- --all
# Opción B (BFG Repo-Cleaner):
java -jar bfg.jar --delete-files .env,.env.example
```

## Paso 3 — Restaurar .env.example (filter-repo lo borró)
```bash
git checkout HEAD~1 -- .env.example  # o simplemente editar manualmente
```

## Paso 4 — Force-push a GitHub
```bash
git push --force-with-lease
```
**Importante:** avisar a los testers que hagan `git fetch && git reset --hard origin/main` o re-clonen. No hacer `git pull`.

## Paso 5 — Vercel
1. Ir a Vercel → proyecto → Settings → Environment Variables
2. Actualizar `VITE_API_TOKEN` en Production y Preview con el nuevo token
3. Ir a Deployments → Trigger Deploy (forzar redeploy, no esperar auto-deploy)

## Paso 6 — Smokes de verificación

### V5 — Token viejo rechazado
```bash
curl -i -H "Authorization: Bearer <TOKEN_VIEJO>" "https://presidenciamonitoreo1424api.gabsocial.gob.do/api/estadisticasPresidencia/getParticipantsStaticsPaged?pageIndex=0&pageSize=1"
```
Esperado: HTTP 401 o 403, sin datos de participantes en el body.

### V6 — Token nuevo aceptado
```bash
curl -i -H "Authorization: Bearer <TOKEN_NUEVO>" "https://presidenciamonitoreo1424api.gabsocial.gob.do/api/estadisticasPresidencia/getParticipantsStaticsPaged?pageIndex=0&pageSize=1"
```
Esperado: HTTP 200, body con `totalItems > 0` e `items` con datos.

### V7 — Fingerprint scan en dist/
```bash
rg -c 'eyJ|bIZl|0fe5a97' . --glob '!node_modules' --glob '!.codegraph' --glob '!.atl' --glob '!.git' --glob '!coverage'
```
Esperado: cero matches. Si hay matches, algo quedó embedido en el build.

## Paso 7 — PR final
El `PR-BODY.md` ya está listo en `openspec/changes/project-health-sweep/PR-BODY.md` con el aviso de re-clonar. Copialo al PR description cuando abras el PR.

---

**Cuando vuelvas con el token nuevo, decime "tengo el token nuevo" y te guío paso a paso.**
