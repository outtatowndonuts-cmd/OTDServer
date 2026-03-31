export default function ProductGrid({ products, onSelect }) {
  if (!products.length) {
    return <div className="loading">No products found. Add products in the Recipes module.</div>;
  }

  return (
    <div className="product-grid">
      {products.map((p) => (
        <div key={p._id} className="product-card" onClick={() => onSelect(p)}>
          <div className="product-name">{p.name}</div>
          <div className="product-price">${(p.price || 0).toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}
