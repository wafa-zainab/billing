import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATABASE = 'billing.db'

def get_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item TEXT,
            quantity INTEGER,
            price REAL
        )
    """)
    conn.commit()
    conn.close()

@app.route("/items", methods=["GET"])
def get_items():
    return jsonify({
        "Coffee": 50,
        "Tea": 30,
        "Sandwich": 80,
        "Cake": 100,
        "Juice": 60
    })

@app.route("/submit-bill", methods=["POST"])
def submit_bill():
    try:
        data = request.get_json()
        items = data.get("items", [])
        if not items:
            return jsonify({"error": "No items provided"}), 400

        total = sum(item['price'] * item['quantity'] for item in items)

        conn = get_connection()
        cursor = conn.cursor()

        for item in items:
            cursor.execute(
                "INSERT INTO bills (item, quantity, price) VALUES (?, ?, ?)",
                (item['name'], item['quantity'], item['price'])
            )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Bill submitted", "total": total})

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
