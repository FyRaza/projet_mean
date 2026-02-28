const base = "http://localhost:5000";

const request = async (path, options = {}) => {
  const response = await fetch(`${base}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { ok: response.ok, status: response.status, data };
};

const report = [];
const push = (name, pass, extra = "") => {
  report.push({ name, pass, extra });
  console.log(`${pass ? "PASS" : "FAIL"} | ${name}${extra ? ` | ${extra}` : ""}`);
};

const run = async () => {
  const root = await request("/");
  push("GET /", root.ok, `HTTP ${root.status}`);

  const adminLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@mall.mg", password: "Admin1234!" },
  });
  push("POST /api/auth/login admin", adminLogin.ok, `HTTP ${adminLogin.status}`);

  const boutiqueLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "boutique@mall.mg", password: "Boutique1234!" },
  });
  push("POST /api/auth/login boutique", boutiqueLogin.ok, `HTTP ${boutiqueLogin.status}`);

  const clientLogin = await request("/api/auth/login", {
    method: "POST",
    body: { email: "client@mall.mg", password: "Client1234!" },
  });
  push("POST /api/auth/login client", clientLogin.ok, `HTTP ${clientLogin.status}`);

  const adminToken = adminLogin.data?.token;
  const boutiqueToken = boutiqueLogin.data?.token;
  const clientToken = clientLogin.data?.token;
  const boutiqueUserId = boutiqueLogin.data?.user?.id;

  const me = await request("/api/auth/me", { token: clientToken });
  push("GET /api/auth/me", me.ok, `HTTP ${me.status}`);

  const updateMe = await request("/api/auth/me", {
    method: "PUT",
    token: clientToken,
    body: { phone: "+261340000001" },
  });
  push("PUT /api/auth/me", updateMe.ok, `HTTP ${updateMe.status}`);

  const addAddress = await request("/api/auth/me/addresses", {
    method: "POST",
    token: clientToken,
    body: {
      label: "Domicile QA",
      street: "Lot II A 12",
      city: "Antananarivo",
      postalCode: "101",
      country: "Madagascar",
      isDefault: true,
    },
  });
  push("POST /api/auth/me/addresses", addAddress.ok, `HTTP ${addAddress.status}`);

  const listAddresses = await request("/api/auth/me/addresses", { token: clientToken });
  push(
    "GET /api/auth/me/addresses",
    listAddresses.ok && Array.isArray(listAddresses.data),
    `count ${(listAddresses.data || []).length}`
  );

  const boutiques = await request("/api/boutiques");
  push("GET /api/boutiques", boutiques.ok, `HTTP ${boutiques.status}`);

  const categories = await request("/api/categories", { token: adminToken });
  push("GET /api/categories", categories.ok, `HTTP ${categories.status}`);

  const ownedBoutique = (boutiques.data || []).find((b) => {
    const ownerId = b?.owner?._id || b?.owner;
    return String(ownerId) === String(boutiqueUserId);
  });
  const firstBoutiqueId = ownedBoutique?._id || boutiques.data?.[0]?._id;
  const firstCategoryId = categories.data?.[0]?._id;

  const createProduct = await request("/api/products", {
    method: "POST",
    token: boutiqueToken,
    body: {
      name: "Produit QA API",
      price: 12345,
      description: "Produit de validation QA",
      categoryId: firstCategoryId,
      boutiqueId: firstBoutiqueId,
      stock: 10,
      images: ["https://picsum.photos/200"],
      status: "active",
    },
  });
  push("POST /api/products", createProduct.ok, `HTTP ${createProduct.status}`);

  const createdProductId = createProduct.data?._id;
  if (createdProductId) {
    const updateProduct = await request(`/api/products/${createdProductId}`, {
      method: "PUT",
      token: boutiqueToken,
      body: { price: 13000, status: "draft" },
    });
    push("PUT /api/products/:id", updateProduct.ok, `HTTP ${updateProduct.status}`);
  }

  const products = await request("/api/products?limit=3");
  push("GET /api/products", products.ok, `HTTP ${products.status}`);

  const firstProduct = products.data?.products?.[0];
  const order = await request("/api/orders", {
    method: "POST",
    token: clientToken,
    body: {
      items: [{ product: firstProduct?._id, quantity: 1 }],
      boutiqueId: firstProduct?.boutique?._id || firstProduct?.boutique,
      shippingAddress: {
        street: "Lot II A 12",
        city: "Antananarivo",
        postalCode: "101",
        country: "Madagascar",
      },
    },
  });
  push("POST /api/orders", order.ok, `HTTP ${order.status}`);

  const orders = await request("/api/orders", { token: clientToken });
  push("GET /api/orders", orders.ok, `HTTP ${orders.status}`);

  const failed = report.filter((item) => !item.pass).length;
  console.log(`\nTOTAL: ${report.length - failed}/${report.length} PASS`);
  process.exit(failed ? 1 : 0);
};

run().catch((error) => {
  console.error("Smoke script failed:", error);
  process.exit(1);
});
