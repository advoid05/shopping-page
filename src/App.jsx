import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://fakestoreapi.com/products";
const CART_KEY = "cartIds";
const LIKED_KEY = "likedStatus";
const HISTORY_KEY = "browseHistory";

const toPascalCase = (str) => {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatINR = (price) =>
  Number(price).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    style: "currency",
    currency: "INR",
  });

function ProductCard({
  product,
  mode, // "catalog" | "detail" | "cart" | "liked" | "history"
  likedStatus,
  inCart,
  onLike,
  onDislike,
  onToggleCart,
  onRemoveCart,
  onOpenProduct,
  viewedAt, // for history
}) {
  const status = likedStatus[product.id];

  return (
    <div className="product-card">
      <div className="product-card-header">
        {product.image && (
          <img
            src={product.image}
            alt={product.title}
            className="product-image"
          />
        )}
        {inCart && mode !== "cart" && (
          <span className="wishlist-badge">In Cart</span>
        )}
      </div>

      <div className="product-info">
        <h2 className="product-title">{product.title}</h2>
        <p className="product-category">{toPascalCase(product.category)}</p>
        <p className="product-price">{formatINR(product.price)}</p>

        {mode === "detail" && product.rating && (
          <p className="product-rating">
            Rating: {product.rating.rate} ({product.rating.count} reviews)
          </p>
        )}

        {mode === "detail" && (
          <p className="product-description">{product.description}</p>
        )}

        {mode === "history" && viewedAt && (
          <p className="product-rating">
            Viewed: {new Date(viewedAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="product-actions">
        {(mode === "catalog" || mode === "liked" || mode === "history") && (
          <button
            className="btn btn-details"
            onClick={() => onOpenProduct(product.id)}
          >
            Visit Product
          </button>
        )}

        {mode === "cart" && (
          <>
            <button
              className="btn btn-details"
              onClick={() => onOpenProduct(product.id)}
            >
              View Details
            </button>
            <button
              className="btn btn-remove-cart"
              onClick={() => onRemoveCart(product.id)}
            >
              Remove from Cart
            </button>
          </>
        )}

        {mode === "detail" && (
          <>
            <button
              className={`btn btn-like ${status === "like" ? "active" : ""}`}
              onClick={() => onLike(product.id)}
            >
              {status === "like" ? "Liked" : "Like"}
            </button>
            <button
              className={`btn btn-dislike ${status === "dislike" ? "active" : ""}`}
              onClick={() => onDislike(product.id)}
            >
              {status === "dislike" ? "Disliked" : "Dislike"}
            </button>
            <button
              className={`btn btn-wishlist ${inCart ? "active" : ""}`}
              onClick={() => onToggleCart(product.id)}
            >
              {inCart ? "Remove from Cart" : "Add to Cart"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [likedStatus, setLikedStatus] = useState(() => {
    try {
      const stored = localStorage.getItem(LIKED_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [cartIds, setCartIds] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [browseHistory, setBrowseHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const searchParams = new URLSearchParams(window.location.search);
  const isCartView = searchParams.get("view") === "cart";
  const isLikedView = searchParams.get("view") === "liked";
  const isProductView = searchParams.get("view") === "product";
  const isHistoryView = searchParams.get("view") === "history";
  const productIdParam = searchParams.get("id");
  const isCatalogView = !isCartView && !isLikedView && !isProductView && !isHistoryView;

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    try { localStorage.setItem(LIKED_KEY, JSON.stringify(likedStatus)); } catch {}
  }, [likedStatus]);

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cartIds)); } catch {}
  }, [cartIds]);

  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(browseHistory)); } catch {}
  }, [browseHistory]);

  const handleLike = (id) =>
    setLikedStatus((prev) => ({
      ...prev,
      [id]: prev[id] === "like" ? undefined : "like",
    }));

  const handleDislike = (id) =>
    setLikedStatus((prev) => ({
      ...prev,
      [id]: prev[id] === "dislike" ? undefined : "dislike",
    }));

  const toggleCart = (id) =>
    setCartIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const removeFromCart = (id) =>
    setCartIds((prev) => prev.filter((x) => x !== id));

  const goHome = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("view");
    url.searchParams.delete("id");
    window.location.href = url.toString();
  };

  const openInNewTab = (params) => {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([k, v]) => {
      if (v === null) url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    });
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  const openProductTab = (id) => {
    setBrowseHistory((prev) => {
      const next = [{ id, ts: Date.now() }, ...(Array.isArray(prev) ? prev : [])];
      return next.slice(0, 200);
    });
    openInNewTab({ view: "product", id: String(id) });
  };

  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category))).sort(),
  ];

  const visibleProducts = isProductView && productIdParam
    ? products.filter((p) => String(p.id) === String(productIdParam))
    : isCartView
    ? products.filter((p) => cartIds.includes(p.id))
    : isLikedView
    ? products.filter((p) => likedStatus[p.id] === "like")
    : isHistoryView
    ? products.filter((p) =>
        browseHistory.some((h) => String(h.id) === String(p.id))
      )
    : products;

  const displayedProducts = visibleProducts.filter((p) =>
    selectedCategory === "All" ? true : p.category === selectedCategory
  );

  const displayedHistoryEntries = (Array.isArray(browseHistory) ? browseHistory : [])
    .map((entry) => {
      const product = products.find((p) => String(p.id) === String(entry.id));
      return product ? { ...entry, product } : null;
    })
    .filter(Boolean)
    .filter((entry) =>
      selectedCategory === "All" ? true : entry.product.category === selectedCategory
    );

  const clearHistory = () => {
    setBrowseHistory([]);
    window.location.reload();
  };

  const cardMode = isCartView
    ? "cart"
    : isLikedView
    ? "liked"
    : isProductView
    ? "detail"
    : isHistoryView
    ? "history"
    : "catalog";

  const pageTitle = isHistoryView
    ? "Browsing History"
    : isProductView
    ? "Product Details"
    : isCartView
    ? "My Cart"
    : isLikedView
    ? "Liked Products"
    : "Product Catalog";

  return (
    <div className="app">
      <header className="app-header">
        <h1>{pageTitle}</h1>
        <div className="header-actions">
          <button className="btn btn-home" onClick={goHome}>
            Home
          </button>
          {!isCartView && (
            <button
              className="btn btn-open-wishlist"
              onClick={() => openInNewTab({ view: "cart", id: null })}
            >
              Your Cart
            </button>
          )}
          {!isLikedView && (
            <button
              className="btn btn-open-wishlist"
              onClick={() => openInNewTab({ view: "liked", id: null })}
            >
              Liked
            </button>
          )}
          {isCatalogView && (
            <button
              className="btn btn-open-wishlist"
              onClick={() => openInNewTab({ view: "history", id: null })}
            >
              Your History
            </button>
          )}
          {isHistoryView && (
            <button className="btn btn-open-wishlist" onClick={clearHistory}>
              Clear History
            </button>
          )}
        </div>
      </header>

      {loading && <p>Loading products...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <nav className="category-filter">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`btn btn-category ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "All" ? "All" : toPascalCase(cat)}
            </button>
          ))}
        </nav>
      )}

      {!loading && !error && isHistoryView && displayedHistoryEntries.length === 0 && (
        <p>No browsing history yet.</p>
      )}
      {!loading && !error && !isHistoryView && displayedProducts.length === 0 && (
        <p>No products to show.</p>
      )}

      <div className="products-grid">
        {isHistoryView
          ? displayedHistoryEntries.map((entry, idx) => (
              <ProductCard
                key={`${entry.id}-${entry.ts}-${idx}`}
                product={entry.product}
                mode="history"
                likedStatus={likedStatus}
                inCart={cartIds.includes(entry.product.id)}
                onLike={handleLike}
                onDislike={handleDislike}
                onToggleCart={toggleCart}
                onRemoveCart={removeFromCart}
                onOpenProduct={openProductTab}
                viewedAt={entry.ts}
              />
            ))
          : displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                mode={cardMode}
                likedStatus={likedStatus}
                inCart={cartIds.includes(product.id)}
                onLike={handleLike}
                onDislike={handleDislike}
                onToggleCart={toggleCart}
                onRemoveCart={removeFromCart}
                onOpenProduct={openProductTab}
              />
            ))}
      </div>
    </div>
  );
}

export default App;