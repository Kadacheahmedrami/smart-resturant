// Mock data for in-memory storage
export const orders = [
  {
    id: "789012",
    status: "PENDING",
    items: [
      { name: "Margherita Pizza", quantity: 1, price: 12.99, notes: "Extra cheese" },
      { name: "Caesar Salad", quantity: 1, price: 8.99, notes: "Dressing on the side" },
      { name: "Sparkling Water", quantity: 2, price: 3.99, notes: "" },
    ],
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
    updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "789011",
    status: "PENDING",
    items: [
      { name: "Pepperoni Pizza", quantity: 1, price: 14.99, notes: "" },
      { name: "Chocolate Cake", quantity: 1, price: 7.99, notes: "Birthday candle please" },
    ],
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(), // 20 minutes ago
    updatedAt: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    id: "789010",
    status: "ACCEPTED",
    items: [
      { name: "Spaghetti Carbonara", quantity: 1, price: 15.99, notes: "No bacon" },
      { name: "Grilled Salmon", quantity: 1, price: 18.99, notes: "Well done" },
    ],
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
    updatedAt: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: "789009",
    status: "REJECTED",
    items: [{ name: "Margherita Pizza", quantity: 2, price: 12.99, notes: "" }],
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(), // 45 minutes ago
    updatedAt: new Date(Date.now() - 40 * 60000).toISOString(),
  },
  {
    id: "789008",
    status: "READY",
    items: [
      { name: "Caesar Salad", quantity: 1, price: 8.99, notes: "" },
      { name: "Chocolate Cake", quantity: 1, price: 7.99, notes: "" },
    ],
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(), // 60 minutes ago
    updatedAt: new Date(Date.now() - 50 * 60000).toISOString(),
  },
]
