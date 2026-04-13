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
      {products.map((p) => {
        const stock = p.inventoryQty ?? 0;
        const outOfStock = stock <= 0;
        return (
          <div key={p._id} className={`product-card${outOfStock ? ' product-card--oos' : ''}`} onClick={() => !outOfStock && onSelect(p)} title={outOfStock ? 'Out of stock' : `${stock} in stock`}>
            <div className="product-name">{p.name}</div>
            <div className="product-price">{fmt(p.price || 0)}</div>
            <div className={`product-stock${outOfStock ? ' product-stock--oos' : stock <= 3 ? ' product-stock--low' : ''}`}>{outOfStock ? 'Out of stock' : `${stock} avail.`}</div>
          </div>
        );
      })}
    </div>
  );
}
