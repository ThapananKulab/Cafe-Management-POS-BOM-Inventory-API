const express = require("express");
const router = express.Router();
const moment = require("moment-timezone");
const SaleOrder = require("../models/SaleOrder.js");
const InventoryItem = require("../models/InventoryItem");

router.post("/saleOrders", async (req, res) => {
  try {
    const { user, items, total, status, paymentMethod, notes, change } =
      req.body;

    const newOrder = new SaleOrder({
      user,
      items,
      total,
      status,
      paymentMethod,
      notes,
      change,
    });

    const savedOrder = await newOrder.save();

    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/saleOrders", async (req, res) => {
  try {
    const saleOrders = await SaleOrder.find();
    res.json(saleOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/dashboard/saleOrders", async (req, res) => {
  try {
    const saleOrders = await SaleOrder.find({
      status: { $nin: ["Pending", "Cancelled"] },
    });
    const numberOfOrders = saleOrders.length; // นับจำนวนออเดอร์ทั้งหมดที่มีสถานะไม่ใช่ "Pending" หรือ "Cancelled"
    res.json({ numberOfOrders, saleOrders }); // ส่งกลับจำนวนออเดอร์และข้อมูลออเดอร์ที่ตรงเงื่อนไข
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/all/saleOrders", async (req, res) => {
  try {
    const saleOrders = await SaleOrder.find();
    const numberOfOrders = saleOrders.length; // นับจำนวนออเดอร์ทั้งหมด
    res.json({ numberOfOrders, saleOrders }); // ส่งกลับจำนวนออเดอร์และข้อมูลออเดอร์ทั้งหมด
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/dashboard/dailySales", async (req, res) => {
  try {
    // Get current date in the local time zone (assuming Bangkok time zone)
    const today = moment().tz("Asia/Bangkok");

    // Calculate start and end of the day in the local time zone
    const startOfDay = today.clone().startOf("day");
    const endOfDay = today.clone().endOf("day");

    // Query for sales within the specified time range
    const dailySales = await SaleOrder.aggregate([
      {
        $match: {
          status: { $nin: ["Pending", "Cancelled"] },
          date: { $gte: startOfDay.toDate(), $lte: endOfDay.toDate() },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$total" },
        },
      },
    ]);

    // Check if there are sales for the day
    if (dailySales.length === 0) {
      return res.status(404).json({ message: "No sales found for today" });
    }

    // Respond with the total sales for the day
    res.json({ totalSales: dailySales[0].totalSales });
  } catch (error) {
    // Handle errors
    res.status(500).json({ message: error.message });
  }
});

router.get("/dashboard/mostPurchasedMenuItems", async (req, res) => {
  try {
    const orders = await SaleOrder.find({
      status: { $nin: ["Pending", "Cancelled"] },
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }
    const menuItemsMap = new Map();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const menuItemId = item.menuItem;
        const menuItem = item.name;
        if (menuItemId && menuItem) {
          if (!menuItemsMap.has(menuItem)) {
            menuItemsMap.set(menuItem, 0);
          }
          menuItemsMap.set(
            menuItem,
            menuItemsMap.get(menuItem) + item.quantity
          );
        }
      });
    });
    const mostPurchasedMenuItemsData = Array.from(menuItemsMap.entries()).map(
      ([name, quantity]) => ({
        name,
        quantity,
      })
    );
    mostPurchasedMenuItemsData.sort((a, b) => b.quantity - a.quantity);
    const top10MostPurchasedMenuItems = mostPurchasedMenuItemsData.slice(0, 10);

    res.json(top10MostPurchasedMenuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/saleOrders/currentdate", async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const saleOrders = await SaleOrder.find({
      date: {
        // Use the 'date' field
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });

    res.json(saleOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const { orderNumber, user, items, total, status, paymentMethod, notes } =
      req.body;

    // Create a new SaleOrder document
    const newOrder = new SaleOrder({
      orderNumber,
      user,
      items,
      total,
      status,
      paymentMethod,
      notes,
    });

    // Save the new order to the database
    const savedOrder = await newOrder.save();

    res.status(201).json(savedOrder); // Respond with the created order
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/saleOrders/date/:formattedDate", async (req, res) => {
  try {
    const { formattedDate } = req.params;
    const saleOrders = await SaleOrder.find({ date: formattedDate });

    res.json(saleOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/saleOrders/date/:formattedDate", async (req, res) => {
  try {
    const { formattedDate } = req.params;

    // Convert formattedDate to Date object
    const date = new Date(formattedDate);

    // Set start of the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    // Set end of the day
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Find orders within the specified date range
    const saleOrders = await SaleOrder.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    res.json(saleOrders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const checkStockSufficiency = async (orderId) => {
  try {
    // Retrieve the order from the database
    const order = await SaleOrder.findById(orderId);

    // Check if the order exists
    if (!order) {
      console.error("Order not found");
      return false;
    }

    // Check stock sufficiency based on the items in the order
    for (const item of order.items) {
      // Check if the inventory item is available in sufficient quantity
      const inventoryItem = await InventoryItem.findOne({
        itemId: item.itemId,
      });
      if (!inventoryItem || inventoryItem.quantityInStock < item.quantity) {
        return false; // Not enough stock available
      }
    }

    return true; // Stock is sufficient for all items in the order
  } catch (error) {
    console.error("Error checking stock sufficiency:", error);
    return false; // Return false in case of any error
  }
};

// Now define the /accept route
router.post("/:orderId/accept", async (req, res) => {
  const { orderId } = req.params;

  try {
    const isStockSufficient = await checkStockSufficiency(orderId);

    if (!isStockSufficient) {
      // If stock is not sufficient, set order status to 'Pending' instead of 'Completed'
      const updatedOrder = await SaleOrder.findByIdAndUpdate(
        orderId,
        { status: "Pending" },
        { new: true }
      );

      return res.status(400).json({
        error: "วัตถุดิบใน Stock ไม่เพียงพอ",
      });
    }

    // If stock is sufficient, update order status to 'Completed'
    const updatedOrder = await SaleOrder.findByIdAndUpdate(
      orderId,
      { status: "Completed" },
      { new: true }
    );

    // Return the updated order
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error accepting order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/:orderId/cancel", async (req, res) => {
  const { orderId } = req.params;

  try {
    // Update order status to 'Cancelled'
    const updatedOrder = await SaleOrder.findByIdAndUpdate(
      orderId,
      { status: "Cancelled" },
      { new: true }
    );

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/:orderId/deductStock", async (req, res) => {
  const { orderId } = req.params;

  try {
    const saleOrder = await SaleOrder.findById(orderId).populate({
      path: "items.menuItem",
      populate: {
        path: "recipe",
        model: "Recipe",
      },
    });

    if (!saleOrder) {
      return res.status(404).json({ message: "Sale order not found." });
    }

    for (const item of saleOrder.items) {
      const menuItem = item.menuItem;

      if (!menuItem.recipe || !menuItem.recipe.ingredients) {
        continue;
      }

      for (const ingredient of menuItem.recipe.ingredients) {
        const inventoryItem = await InventoryItem.findById(
          ingredient.inventoryItemId
        );

        if (!inventoryItem) {
          console.warn(
            `Inventory item not found for ID: ${ingredient.inventoryItemId}`
          );
          continue; // Skip if the inventory item is not found
        }

        // Calculate the new quantity in stock and the amount used
        const quantityUsed = ingredient.quantity * item.quantity;
        const newQuantityInStock = inventoryItem.quantityInStock - quantityUsed;

        // Check if the new quantity is valid
        if (newQuantityInStock < 0) {
          return res.status(400).json({
            message: `Not enough stock for item ID: ${ingredient.inventoryItemId}.`,
          });
        }

        // Update the inventory item
        inventoryItem.quantityInStock = newQuantityInStock;
        inventoryItem.useInStock += quantityUsed; // Update useInStock to reflect usage
        await inventoryItem.save();
      }
    }

    res.status(200).json({ message: "Stock deducted successfully." });
  } catch (error) {
    console.error("Error deducting stock:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
