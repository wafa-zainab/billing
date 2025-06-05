import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [items, setItems] = useState({});
  const [selectedItem, setSelectedItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [bill, setBill] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemIcons = {
    Coffee: "☕",
    Tea: "🍵",
    Sandwich: "🥪",
    Cake: "🍰",
  };

  useEffect(() => {
    fetch("http://localhost:5000/items")
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setSelectedItem(Object.keys(data)[0] || "");
      })
      .catch(() => setError("⚠️ Failed to fetch items."));
  }, []);

  const addItem = () => {
    setError("");
    if (!selectedItem || quantity < 1) {
      setError("⚠️ Select an item and valid quantity.");
      return;
    }

    const price = items[selectedItem];
    const existingIndex = bill.findIndex((b) => b.name === selectedItem);

    if (existingIndex !== -1) {
      const newBill = [...bill];
      newBill[existingIndex].quantity += quantity;
      setBill(newBill);
    } else {
      setBill([...bill, { name: selectedItem, quantity, price }]);
    }
    setQuantity(1);
  };

  const updateQuantity = (index, newQty) => {
    if (newQty < 1) return;
    const newBill = [...bill];
    newBill[index].quantity = newQty;
    setBill(newBill);
  };

  const removeItem = (index) => {
    const newBill = [...bill];
    newBill.splice(index, 1);
    setBill(newBill);
  };

  const clearBill = () => setBill([]);

  const submitBill = () => {
    setError("");
    if (bill.length === 0) {
      setError("⚠️ Add items before submitting.");
      return;
    }

    setIsSubmitting(true);
    fetch("http://localhost:5000/submit-bill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: bill }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Unknown error");
        }
        return res.json();
      })
      .then((data) => {
        alert(`✅ Bill submitted! Total: ₹${data.total}`);
        setBill([]);
      })
      .catch((err) => {
        setError("🚫 Error: " + err.message);
      })
      .finally(() => setIsSubmitting(false));
  };

  const subTotal = bill.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = +(subTotal * 0.18).toFixed(2);
  const grandTotal = +(subTotal + tax).toFixed(2);

  return (
    <div className="container">
      <h1>🧾 Billing App</h1>

      {error && <div className="error">{error}</div>}

      <label>Select Item</label>
      <select
        value={selectedItem}
        onChange={(e) => setSelectedItem(e.target.value)}
      >
        {Object.keys(items).map((item) => (
          <option key={item} value={item}>
            {itemIcons[item] || "🧃"} {item} - ₹{items[item]}
          </option>
        ))}
      </select>

      <label>Quantity</label>
      <input
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
      />

      <div className="buttons-row">
        <button onClick={addItem} disabled={!selectedItem || quantity < 1}>
          ➕ Add
        </button>
        <button onClick={submitBill} disabled={bill.length === 0 || isSubmitting}>
          {isSubmitting ? "⏳ Submitting..." : "💼 Submit"}
        </button>
        <button onClick={clearBill} disabled={bill.length === 0}>
          ❌ Clear
        </button>
        <button className="print-btn" onClick={() => window.print()}>
          🖨 Print
        </button>
      </div>

      <div className="bill-section">
        <h2>🧾 Bill Items</h2>
        {bill.length === 0 ? (
          <p className="empty">🛒 No items added yet.</p>
        ) : (
          <>
            {bill.map((item, index) => (
              <div key={index} className="bill-item">
                <div className="bill-item-name">
                  {itemIcons[item.name] || "🧃"} {item.name}
                </div>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(index, Number(e.target.value))}
                />
                <div>₹{(item.quantity * item.price).toFixed(2)}</div>
                <button onClick={() => removeItem(index)} className="remove-btn">
                  &times;
                </button>
              </div>
            ))}

            <div className="summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>₹{subTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>GST (18%):</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
