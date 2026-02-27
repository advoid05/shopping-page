import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://fakestoreapi.com/products";
const CART_KEY = "cartIds";
const LIKED_KEY = "likedStatus";
const HISTORY_KEY = "browseHistory";

// Helper function for Pascal Case (e.g., "men's clothing" -> "Men's Clothing")
const toPascalCase = (str) => {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

function App() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedStatus, setLikedStatus] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(LIKED_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [cartIds, setCartIds] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(CART_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [browseHistory, setBrowseHistory] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;

  const isCartView = searchParams?.get("view") === "cart";
  const isLikedView = searchParams?.get("view") === "liked";
  const isProductView = searchParams?.get("view") === "product";
  const isHistoryView = searchParams?.get("view") === "history";
  const productIdParam = searchParams?.get("id");
  const isCatalogView =
    !isCartView && !isLikedView && !isProductView && !isHistoryView;

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
    try {
      localStorage.setItem(LIKED_KEY, JSON.stringify(likedStatus));
    } catch (e) {
      console.error("Storage error", e);
    }
  }, [likedStatus]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cartIds));
    } catch (e) {
      console.error("Storage error", e);
    }
  }, [cartIds]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(browseHistory));
    } catch (e) {
      console.error("Storage error", e);
    }
  }, [browseHistory]);

  const handleLike = (productId) => {
    setLikedStatus((prev) => ({
      ...prev,
      [productId]: prev[productId] === "like" ? undefined : "like",
    }));
  };

  const handleDislike = (productId) => {
    setLikedStatus((prev) => ({
      ...prev,
      [productId]: prev[productId] === "dislike" ? undefined : "dislike",
    }));
  };

  const toggleCart = (productId) => {
    setCartIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const openCartTab = () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("view", "cart");
    url.searchParams.delete("id");
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  const openLikedTab = () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("view", "liked");
    url.searchParams.delete("id");
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  const openHistoryTab = () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("view", "history");
    url.searchParams.delete("id");
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  const openProductTab = (productId) => {
    if (typeof window === "undefined") return;
    setBrowseHistory((prev) => {
      const next = [
        { id: productId, ts: Date.now() },
        ...(Array.isArray(prev) ? prev : []),
      ];
      return next.slice(0, 200);
    });
    const url = new URL(window.location.href);
    url.searchParams.set("view", "product");
    url.searchParams.set("id", String(productId));
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  const visibleProducts =
    isProductView && productIdParam
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

  const categories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category))).sort(),
  ];

  const displayedProducts = visibleProducts.filter((p) =>
    selectedCategory === "All" ? true : p.category === selectedCategory
  );

  const likedCount = Object.values(likedStatus).filter(
    (status) => status === "like"
  ).length;

  const displayedHistoryEntries = (Array.isArray(browseHistory)
    ? browseHistory
    : []
  )
    .map((entry) => {
      const product = products.find((p) => String(p.id) === String(entry.id));
      return product ? { ...entry, product } : null;
    })
    .filter(Boolean)
    .filter((entry) =>
      selectedCategory === "All"
        ? true
        : entry.product.category === selectedCategory
    );

  const clearHistory = () => {
    setBrowseHistory([]);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          {isHistoryView
            ? "Browsing History"
            : isProductView
            ? "Product Details"
            : isCartView
            ? "My Cart"
            : isLikedView
            ? "Liked Products"
            : "Product Catalog"}
        </h1>
        <div className="header-actions">
          {!isCartView && (
            <button className="btn btn-open-wishlist" onClick={openCartTab}>
              Your Cart  
            </button>
          )}
          {!isLikedView && (
            <button className="btn btn-open-wishlist" onClick={openLikedTab}>
              Liked 
            </button>
          )}
          {isCatalogView && (
            <button className="btn btn-open-wishlist" onClick={openHistoryTab}>
              Your History
            </button>
          )}
          {isHistoryView && (
            <button className="btn btn-open-wishlist" onClick={clearHistory}>
              Clear Browsing History
            </button>
          )}
        </div>
      </header>

      {loading && <p>Loading products...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <nav className="category-filter">
          {categories.map((category) => (
            <button
              key={category}
              className={`btn btn-category ${selectedCategory === category ? "active" : ""}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === "All" ? "All" : toPascalCase(category)}
            </button>
          ))}
        </nav>
      )}

      {!loading && !error && isHistoryView && displayedHistoryEntries.length === 0 && (
        <p>No browsing history yet. </p>
      )}

      {!loading && !error && !isHistoryView && displayedProducts.length === 0 && (
        <p>No products to show.</p>
      )}

      <div className="products-grid">
        {isHistoryView
          ? displayedHistoryEntries.map((entry, idx) => {
              const product = entry.product;
              return (
                <div key={`${entry.id}-${entry.ts}-${idx}`} className="product-card">
                  <div className="product-card-header">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="product-image"
                      />
                    )}
                  </div>

                  <h2 className="product-title">{product.title}</h2>

                  <p className="product-category">
                    {toPascalCase(product.category)}
                  </p>

                  <p className="product-price">
                    ₹
                    {Number(product.price).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </p>

                  <p className="product-rating">
                    Viewed: {new Date(entry.ts).toLocaleString()}
                  </p>

                  <div className="product-actions">
                    <button
                      className="btn btn-details"
                      onClick={() => openProductTab(product.id)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })
          : displayedProducts.map((product) => {
          const status = likedStatus[product.id];
          const inCart = cartIds.includes(product.id);

          // Catalog / list view: only image, type, price, and "View Details"
          if (!isProductView) {
            return (
              <div key={product.id} className="product-card">
                <div className="product-card-header">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="product-image"
                    />
                  )}
                </div>

                <h2 className="product-title">{product.title}</h2>

                <p className="product-category">
                  {toPascalCase(product.category)}
                </p>

                <p className="product-price">
                  ₹
                  {Number(product.price).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </p>

                <div className="product-actions">
                  <button
                    className="btn btn-details"
                    onClick={() => openProductTab(product.id)}
                  >
                    Visit Product
                  </button>
                </div>
              </div>
            );
          }

          // Product details view: full information, like/dislike, add to cart
          return (
            <div key={product.id} className="product-card">
              <div className="product-card-header">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="product-image"
                  />
                )}
                {inCart && <span className="wishlist-badge">In Cart</span>}
              </div>

              <h2 className="product-title">{product.title}</h2>

              <p className="product-category">
                {toPascalCase(product.category)}
              </p>

              <p className="product-price">
                ₹
                {Number(product.price).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </p>

              {product.rating && (
                <p className="product-rating">
                  Rating: {product.rating.rate} ({product.rating.count} reviews)
                </p>
              )}

              <p className="product-description">{product.description}</p>

              <div className="product-actions">
                <button
                  className={`btn btn-like ${
                    status === "like" ? "active" : ""
                  }`}
                  onClick={() => handleLike(product.id)}
                >
                  {status === "like" ? "Liked" : "Like"}
                </button>

                <button
                  className={`btn btn-dislike ${
                    status === "dislike" ? "active" : ""
                  }`}
                  onClick={() => handleDislike(product.id)}
                >
                  {status === "dislike" ? "Disliked" : "Dislike"}
                </button>

                <button
                  className={`btn btn-wishlist ${inCart ? "active" : ""}`}
                  onClick={() => toggleCart(product.id)}
                >
                  {inCart ? "Remove from Cart" : "Add to Cart"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;