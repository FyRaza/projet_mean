$BASE = "http://localhost:5000"
$pass = 0
$fail = 0
$ADMIN_TOKEN = ""
$BOUTIQUE_TOKEN = ""
$CLIENT_TOKEN = ""
$FIRST_BOUTIQUE_ID = ""
$FIRST_PRODUCT_ID = ""
$NEW_BOUTIQUE_ID = ""

function Invoke-Test {
    param([string]$Name, [string]$Method, [string]$Url, [string]$Body = "", [string]$Token = "", [int]$ExpectFail = 0)
    try {
        $headers = @{ "Content-Type" = "application/json" }
        if ($Token) { $headers["Authorization"] = "Bearer $Token" }
        if ($Body) {
            $resp = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body $Body -ErrorAction Stop
        }
        else {
            $resp = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -ErrorAction Stop
        }
        if ($ExpectFail -gt 0) {
            Write-Host "  ❌ FAIL | $Name [aurait du échouer avec $ExpectFail]" -ForegroundColor Red
            return $null
        }
        Write-Host "  ✅ PASS | $Name" -ForegroundColor Green
        return $resp
    }
    catch {
        $code = 0
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        if ($ExpectFail -gt 0 -and $code -eq $ExpectFail) {
            Write-Host "  ✅ PASS | $Name [erreur $code attendue]" -ForegroundColor Green
            return "EXPECTED_ERROR"
        }
        Write-Host "  ❌ FAIL | $Name → HTTP $code | $($_.Exception.Message.Split([char]10)[0])" -ForegroundColor Red
        return $null
    }
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   TESTS COMPLETS API MALL MANAGEMENT               " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# ── 1. ROOT
Write-Host ""
Write-Host "[1/5] Sante du serveur" -ForegroundColor Yellow
$r = Invoke-Test "GET / root" "GET" "$BASE"
if ($r) { $pass++; Write-Host "       message: $($r.message)" -ForegroundColor DarkGray } else { $fail++ }

# ── 2. AUTH
Write-Host ""
Write-Host "[2/5] Authentification" -ForegroundColor Yellow

$r = Invoke-Test "POST /api/auth/register — Nouvel utilisateur" "POST" "$BASE/api/auth/register" '{"firstName":"Tester","lastName":"Auto","email":"tester.auto99@mail.com","password":"Test9999!","role":"acheteur"}'
if ($r) { $pass++ } else { $fail++ }

$r = Invoke-Test "POST /api/auth/register — Email deja existant (400 attendu)" "POST" "$BASE/api/auth/register" '{"firstName":"Tester","lastName":"Auto","email":"tester.auto99@mail.com","password":"Test9999!","role":"acheteur"}' "" 400
if ($r) { $pass++ } else { $fail++ }

$r = Invoke-Test "POST /api/auth/login — Admin" "POST" "$BASE/api/auth/login" '{"email":"admin@mall.mg","password":"Admin1234!"}'
if ($r) { $pass++; $ADMIN_TOKEN = $r.token; Write-Host "       role: $($r.user.role)" -ForegroundColor DarkGray } else { $fail++ }

$r = Invoke-Test "POST /api/auth/login — Boutique owner" "POST" "$BASE/api/auth/login" '{"email":"boutique@mall.mg","password":"Boutique1234!"}'
if ($r) { $pass++; $BOUTIQUE_TOKEN = $r.token; Write-Host "       role: $($r.user.role)" -ForegroundColor DarkGray } else { $fail++ }

$r = Invoke-Test "POST /api/auth/login — Client" "POST" "$BASE/api/auth/login" '{"email":"client@mall.mg","password":"Client1234!"}'
if ($r) { $pass++; $CLIENT_TOKEN = $r.token; Write-Host "       role: $($r.user.role)" -ForegroundColor DarkGray } else { $fail++ }

$r = Invoke-Test "POST /api/auth/login — Mauvais mot de passe (401 attendu)" "POST" "$BASE/api/auth/login" '{"email":"admin@mall.mg","password":"WRONG"}' "" 401
if ($r) { $pass++ } else { $fail++ }

$r = Invoke-Test "GET /api/auth/me — Sans token (401 attendu)" "GET" "$BASE/api/auth/me" "" "" 401
if ($r) { $pass++ } else { $fail++ }

$r = Invoke-Test "GET /api/auth/me — Avec token admin" "GET" "$BASE/api/auth/me" "" $ADMIN_TOKEN
if ($r) { $pass++; Write-Host "       utilisateur: $($r.firstName) $($r.lastName) ($($r.role))" -ForegroundColor DarkGray } else { $fail++ }

# ── 3. BOUTIQUES
Write-Host ""
Write-Host "[3/5] Boutiques API" -ForegroundColor Yellow

$r = Invoke-Test "GET /api/boutiques — Liste" "GET" "$BASE/api/boutiques"
if ($r) {
    $pass++
    $count = if ($r -is [array]) { $r.Count } else { 1 }
    Write-Host "       $count boutique(s) retournee(s)" -ForegroundColor DarkGray
    $FIRST_BOUTIQUE_ID = if ($r -is [array]) { $r[0]._id } else { $r._id }
}
else { $fail++ }

if ($FIRST_BOUTIQUE_ID) {
    $r = Invoke-Test "GET /api/boutiques/:id — Par ID valide" "GET" "$BASE/api/boutiques/$FIRST_BOUTIQUE_ID"
    if ($r) { $pass++; Write-Host "       boutique: $($r.name) (status: $($r.status))" -ForegroundColor DarkGray } else { $fail++ }
}

$r = Invoke-Test "GET /api/boutiques/:id — ID inexistant (404 attendu)" "GET" "$BASE/api/boutiques/000000000000000000000000" "" "" 404
if ($r) { $pass++ } else { $fail++ }

$r = Invoke-Test "POST /api/boutiques — Sans token (401 attendu)" "POST" "$BASE/api/boutiques" '{"name":"TestSansAuth","description":"x","contactEmail":"x@x.mg"}' "" 401
if ($r) { $pass++ } else { $fail++ }

$r = Invoke-Test "POST /api/boutiques — Role client (403 attendu)" "POST" "$BASE/api/boutiques" '{"name":"TestClientRole","description":"x","contactEmail":"x@x.mg"}' $CLIENT_TOKEN 403
if ($r) { $pass++ } else { $fail++ }

$r = Invoke-Test "POST /api/boutiques — Avec token boutique owner" "POST" "$BASE/api/boutiques" '{"name":"Boutique Test Auto","description":"Creee par test automatique","contactEmail":"testauto@boutique.mg","contactPhone":"+261 34 77 88 99"}' $BOUTIQUE_TOKEN
if ($r) { $pass++; $NEW_BOUTIQUE_ID = $r._id; Write-Host "       ID cree: $NEW_BOUTIQUE_ID" -ForegroundColor DarkGray } else { $fail++ }

if ($NEW_BOUTIQUE_ID) {
    $r = Invoke-Test "PUT /api/boutiques/:id — Mise a jour" "PUT" "$BASE/api/boutiques/$NEW_BOUTIQUE_ID" '{"name":"Boutique Test Modifiee","description":"Description mise a jour"}' $BOUTIQUE_TOKEN
    if ($r) { $pass++; Write-Host "       nom mis a jour: $($r.name)" -ForegroundColor DarkGray } else { $fail++ }

    $r = Invoke-Test "DELETE /api/boutiques/:id — Role boutique (403 attendu)" "DELETE" "$BASE/api/boutiques/$NEW_BOUTIQUE_ID" "" $BOUTIQUE_TOKEN 403
    if ($r) { $pass++ } else { $fail++ }

    $r = Invoke-Test "DELETE /api/boutiques/:id — Role admin (OK)" "DELETE" "$BASE/api/boutiques/$NEW_BOUTIQUE_ID" "" $ADMIN_TOKEN
    if ($r) { $pass++; Write-Host "       message: $($r.message)" -ForegroundColor DarkGray } else { $fail++ }
}

# ── 4. PRODUCTS
Write-Host ""
Write-Host "[4/5] Products API" -ForegroundColor Yellow

$r = Invoke-Test "GET /api/products — Liste complete" "GET" "$BASE/api/products"
if ($r) {
    $pass++
    Write-Host "       $($r.products.Count) produit(s) | page $($r.page)/$($r.pages) | total: $($r.total)" -ForegroundColor DarkGray
    $FIRST_PRODUCT_ID = $r.products[0]._id
}
else { $fail++ }

$r = Invoke-Test "GET /api/products?keyword=chemise — Filtre mot-cle" "GET" "$BASE/api/products?keyword=chemise"
if ($r) { $pass++; Write-Host "       $($r.products.Count) produit(s) pour 'chemise'" -ForegroundColor DarkGray } else { $fail++ }

$r = Invoke-Test "GET /api/products?page=1&limit=2 — Pagination" "GET" "$BASE/api/products?page=1&limit=2"
if ($r) { $pass++; Write-Host "       $($r.products.Count) produit(s) par page (limite 2)" -ForegroundColor DarkGray } else { $fail++ }

if ($FIRST_PRODUCT_ID) {
    $r = Invoke-Test "GET /api/products/:id — Par ID valide" "GET" "$BASE/api/products/$FIRST_PRODUCT_ID"
    if ($r) { $pass++; Write-Host "       produit: $($r.name) | prix: $($r.price) Ar" -ForegroundColor DarkGray } else { $fail++ }
}

$r = Invoke-Test "GET /api/products/:id — ID inexistant (404 attendu)" "GET" "$BASE/api/products/000000000000000000000000" "" "" 404
if ($r) { $pass++ } else { $fail++ }

$r = Invoke-Test "POST /api/products — Sans token (401 attendu)" "POST" "$BASE/api/products" '{"name":"ProdTest","price":10000,"stock":5}' "" 401
if ($r) { $pass++ } else { $fail++ }

$r = Invoke-Test "POST /api/products — Role client (403 attendu)" "POST" "$BASE/api/products" '{"name":"ProdTestClient","price":10000,"stock":5}' $CLIENT_TOKEN 403
if ($r) { $pass++ } else { $fail++ }

# ── 5. SWAGGER
Write-Host ""
Write-Host "[5/5] Documentation Swagger" -ForegroundColor Yellow

$r = Invoke-Test "GET /api/docs.json — Spec OpenAPI JSON" "GET" "$BASE/api/docs.json"
if ($r) {
    $pass++
    $epCount = ($r.paths | Get-Member -MemberType NoteProperty).Count
    Write-Host "       $epCount endpoints documentes | version: $($r.info.version)" -ForegroundColor DarkGray
}
else { $fail++ }

# ── RÉSUMÉ FINAL
$total = $pass + $fail
Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
if ($fail -eq 0) {
    Write-Host "  RESULTAT : $pass/$total tests PASSES - TOUT OK !" -ForegroundColor Green
}
else {
    Write-Host "  RESULTAT : $pass/$total PASSES | $fail ECHECS" -ForegroundColor Yellow
}
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "COMPTES DISPONIBLES POUR TESTER LE FRONTEND :" -ForegroundColor White
Write-Host "  Admin    : admin@mall.mg       / Admin1234!" -ForegroundColor Gray
Write-Host "  Boutique : boutique@mall.mg    / Boutique1234!" -ForegroundColor Gray
Write-Host "  Client   : client@mall.mg      / Client1234!" -ForegroundColor Gray
Write-Host ""
Write-Host "DOCUMENTATION SWAGGER : http://localhost:5000/api/docs" -ForegroundColor White
Write-Host ""
