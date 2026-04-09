const fmt = (n) => {
  const s = n.toFixed(3);
  return '$' + (s.endsWith('0') ? n.toFixed(2) : s);
};

export default function ProductGrid({ products, onSelect }) {
  if (!products.length) {
    return <div className="loading">No products found. Add products in the Recipes module.</div>;
  }

  return (
    <div className="product-grid">
      {products.map((p) => (
        <div key={p._id} className="product-card" onClick={() => onSelect(p)}>
          <div className="product-name">{p.name}</div>
          <div className="product-price">{fmt(p.price || 0)}</div>
        </div>
      ))}
    </div>
  );
}
