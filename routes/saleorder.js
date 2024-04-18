const express = require("express");
const router = express.Router();
const moment = require("moment-timezone");
const SaleOrder = require("../models/SaleOrder.js");
const InventoryItem = require("../models/InventoryItem");

router.post("/saleOrders", async (req, res) => {
  try {
    const { user, items, total, status, paymentMethod, notes, change, profit } =
      req.body;

    const newOrder = new SaleOrder({
      user,
      items,
      total,
      status,
      paymentMethod,
      notes,
      change,
      profit,
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
    const numberOfOrders = saleOrders.length;
    res.json({ numberOfOrders, saleOrders });
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
    const asiaBangkokTimezone = "Asia/Bangkok";
    const asiaBangkokToday = moment
      .tz(asiaBangkokTimezone)
      .format("YYYY-MM-DD");

    const startOfDay = moment
      .tz(asiaBangkokToday, asiaBangkokTimezone)
      .startOf("day");
    const endOfDay = moment
      .tz(asiaBangkokToday, asiaBangkokTimezone)
      .endOf("day");

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

    if (dailySales.length === 0) {
      return res.status(404).json({ message: "No sales found for today" });
    }

    res.json({ totalSales: dailySales[0].totalSales });
  } catch (error) {
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

    const newOrder = new SaleOrder({
      orderNumber,
      user,
      items,
      total,
      status,
      paymentMethod,
      notes,
    });

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

    for (const item of order.items) {
      const inventoryItem = await InventoryItem.findOne({
        itemId: item.itemId,
      });
      if (!inventoryItem || inventoryItem.quantityInStock < item.quantity) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error checking stock sufficiency:", error);
    return false;
  }
};

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
          continue;
        }

        const quantityUsed = ingredient.quantity * item.quantity;
        const newQuantityInStock = inventoryItem.quantityInStock - quantityUsed;

        if (newQuantityInStock < 0) {
          return res.status(400).json({
            message: `Not enough stock for item ID: ${ingredient.inventoryItemId}.`,
          });
        }
        inventoryItem.quantityInStock = newQuantityInStock;
        inventoryItem.useInStock += quantityUsed;
        await inventoryItem.save();
      }
    }

    res.status(200).json({ message: "Stock deducted successfully." });
  } catch (error) {
    console.error("Error deducting stock:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/:orderId/accept", async (req, res) => {
  const { orderId } = req.params;

  try {
    // ตรวจสอบว่าสถานะคำสั่งซื้อเป็น "Pending" หรือไม่
    const order = await SaleOrder.findById(orderId);
    if (order.status !== "Pending") {
      return res.status(400).json({
        error: "คำสั่งซื้อนี้ไม่ได้อยู่ในสถานะรอดำเนินการ",
      });
    }

    // อัพเดทสถานะของคำสั่งซื้อเป็น "Completed"
    const updatedOrder = await SaleOrder.findByIdAndUpdate(
      orderId,
      { status: "Completed" },
      { new: true }
    );

    // ส่งข้อมูลของคำสั่งซื้อที่ถูกอัพเดทกลับไป
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error accepting order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/:orderId/cancel", async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await SaleOrder.findById(orderId);
    if (order.status !== "Pending") {
      return res.status(400).json({
        error: "คำสั่งซื้อนี้ไม่ได้อยู่ในสถานะรอดำเนินการ",
      });
    }
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

router.get("/dashboard/weeklyTotal", async (req, res) => {
  try {
    const currentDate = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
    });
    const currentThaiDate = new Date(currentDate);
    const startOfWeek = new Date(currentThaiDate);
    startOfWeek.setDate(currentThaiDate.getDate() - currentThaiDate.getDay());
    const endOfWeek = new Date(currentThaiDate);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const weeklyOrders = await SaleOrder.find({
      status: { $nin: ["Pending", "Cancelled"] },
      date: { $gte: startOfWeek, $lte: endOfWeek },
    });
    const dailySales = {};
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      dailySales[currentDate.toISOString().slice(0, 10)] = 0;
    }
    for (const order of weeklyOrders) {
      const orderDate = new Date(order.date);
      const orderDateISOString = orderDate.toISOString().slice(0, 10);
      dailySales[orderDateISOString] += order.total;
    }
    res.json({ dailySales });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/dashboard/previousWeeklyTotal", async (req, res) => {
  try {
    const currentDate = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
    });
    const currentThaiDate = new Date(currentDate);

    const startOfPreviousWeek = new Date(currentThaiDate);
    startOfPreviousWeek.setDate(
      currentThaiDate.getDate() - currentThaiDate.getDay() - 7
    );
    const endOfPreviousWeek = new Date(startOfPreviousWeek);
    endOfPreviousWeek.setDate(startOfPreviousWeek.getDate() + 6);

    const previousWeeklyOrders = await SaleOrder.find({
      status: { $nin: ["Pending", "Cancelled"] },
      date: { $gte: startOfPreviousWeek, $lte: endOfPreviousWeek },
    });

    let previousWeeklyTotalSales = 0;
    for (const order of previousWeeklyOrders) {
      previousWeeklyTotalSales += order.total;
    }

    res.json({ totalSales: previousWeeklyTotalSales });
  } catch (error) {
    // Handle errors
    res.status(500).json({ message: error.message });
  }
});

router.get("/report/dailySales", async (req, res) => {
  try {
    const currentDate = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
    });
    const currentThaiDate = new Date(currentDate);
    const startOfDay = new Date(currentThaiDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(currentThaiDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dailyOrders = await SaleOrder.find({
      status: { $nin: ["Pending", "Cancelled"] },
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    let totalSales = 0;
    for (const order of dailyOrders) {
      totalSales += order.total;
    }
    const formattedDate = currentThaiDate.toISOString().slice(0, 10);
    const dailySales = [{ date: formattedDate, totalSales }];
    res.json({ dailySales });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/report/weeklySales", async (req, res) => {
  try {
    const currentDate = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
    });
    const currentThaiDate = new Date(currentDate);
    const startOfWeek = new Date(currentThaiDate);
    const currentDayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklyOrders = await SaleOrder.find({
      status: { $nin: ["Pending", "Cancelled"] },
      date: { $gte: startOfWeek, $lte: endOfWeek },
    });
    const weeklySales = [];
    let totalSales = 0;
    for (let i = 0; i <= currentDayOfWeek; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      currentDate.setHours(0, 0, 0, 0);

      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);

      let dailySales = 0;
      for (const order of weeklyOrders) {
        if (order.date >= currentDate && order.date <= endOfDay) {
          dailySales += order.total;
          totalSales += order.total;
        }
      }
      const formattedDate = currentDate.toISOString().slice(0, 10);
      weeklySales.push({ date: formattedDate, dailySales });
    }

    res.json({ weeklySales, totalSales });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/report/monthlySales", async (req, res) => {
  try {
    const currentDate = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
    });
    const currentThaiDate = new Date(currentDate);
    const orders = await SaleOrder.find({
      status: { $nin: ["Pending", "Cancelled"] },
    });

    const monthlySales = [];
    let totalSales = 0;

    // ลูปผ่านทุกเดือนตั้งแต่เริ่มมีข้อมูลยอดขาย
    const earliestOrder = orders.reduce(
      (earliest, order) => (order.date < earliest ? order.date : earliest),
      orders[0].date
    );
    const earliestMonth = new Date(
      earliestOrder.getFullYear(),
      earliestOrder.getMonth(),
      1
    );

    // เพิ่มเดือนปัจจุบันเข้าไปในการวนลูปด้วย
    const currentMonth = new Date(
      currentThaiDate.getFullYear(),
      currentThaiDate.getMonth(),
      1
    );
    const latestMonth =
      currentMonth > earliestMonth ? currentMonth : earliestMonth;

    while (earliestMonth <= latestMonth) {
      const startOfMonth = new Date(earliestMonth);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(
        earliestMonth.getFullYear(),
        earliestMonth.getMonth() + 1,
        0
      );
      endOfMonth.setHours(23, 59, 59, 999);

      const monthlyOrders = orders.filter(
        (order) => order.date >= startOfMonth && order.date <= endOfMonth
      );

      let monthlySale = [];
      let monthTotal = 0;

      for (const order of monthlyOrders) {
        monthlySale.push({ date: order.date, dailySales: order.total });
        monthTotal += order.total;
      }

      monthlySales.push({
        month: earliestMonth.toISOString().slice(0, 7),
        monthlySale,
        monthTotal,
      });
      totalSales += monthTotal;

      earliestMonth.setMonth(earliestMonth.getMonth() + 1);
    }

    res.json({ totalSales, monthlySales });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/report/yearlySales", async (req, res) => {
  try {
    const currentDate = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Bangkok",
    });
    const currentThaiDate = new Date(currentDate);
    const startOfYear = new Date(
      currentThaiDate.getFullYear(),
      0,
      1,
      0,
      0,
      0,
      0
    );
    const endOfYear = new Date(
      currentThaiDate.getFullYear(),
      11,
      31,
      23,
      59,
      59,
      999
    );

    const yearlyOrders = await SaleOrder.find({
      status: { $nin: ["Pending", "Cancelled"] },
      date: { $gte: startOfYear, $lte: endOfYear },
    });

    const monthlySales = [];
    let totalSales = 0;

    for (let month = 0; month < 12; month++) {
      const startOfMonth = new Date(
        currentThaiDate.getFullYear(),
        month,
        1,
        0,
        0,
        0,
        0
      );
      const endOfMonth = new Date(
        currentThaiDate.getFullYear(),
        month + 1,
        0,
        23,
        59,
        59,
        999
      );

      const monthlyOrders = yearlyOrders.filter(
        (order) => order.date >= startOfMonth && order.date <= endOfMonth
      );

      let monthlySale = [];
      let monthTotal = 0;

      for (const order of monthlyOrders) {
        monthlySale.push({ date: order.date, dailySales: order.total });
        monthTotal += order.total;
      }

      monthlySales.push({
        month: startOfMonth.toISOString().slice(0, 7),
        monthlySale,
        monthTotal,
      });
      totalSales += monthTotal;
    }

    res.json({ totalSales, monthlySales });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/report/payment-methods", async (req, res) => {
  try {
    const report = await SaleOrder.aggregate([
      {
        $match: {
          $and: [
            { status: { $ne: "Cancelled" } }, // ไม่ใช่สถานะ Cancelled
            { status: { $ne: "Pending" } }, // ไม่ใช่สถานะ Pending
          ],
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          totalAmount: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);
    res.json(report);
  } catch (error) {
    console.error("Error fetching payment method report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/report/sales-analysis", async (req, res) => {
  try {
    const hourlyData = [];
    const startHour = 8; // เริ่มตั้งแต่ 08.00 น.
    const endHour = 17; // สิ้นสุดที่ 17.00 น.

    for (let hour = startHour; hour <= endHour; hour++) {
      const startTime = new Date(new Date().setHours(hour, 0, 0, 0));
      const endTime = new Date(new Date().setHours(hour + 1, 0, 0, 0));

      const sales = await SaleOrder.find({
        date: {
          $gte: startTime,
          $lt: endTime,
        },
        status: "Completed",
      });

      const calculateTotalSales = (sales) =>
        sales.reduce((acc, order) => acc + order.total, 0);
      const totalSales = calculateTotalSales(sales);

      const findTopSellingItems = (sales) => {
        const itemMap = new Map();
        sales.forEach((order) => {
          order.items.forEach((item) => {
            if (!itemMap.has(item.name)) {
              itemMap.set(item.name, item.quantity);
            } else {
              itemMap.set(item.name, itemMap.get(item.name) + item.quantity);
            }
          });
        });
        return Array.from(itemMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
      };

      const topItems = findTopSellingItems(sales);

      hourlyData.push({
        timeSlot: `${hour}:00 - ${hour + 1}:00`,
        totalSales,
        topItems,
      });
    }

    res.json(hourlyData);
  } catch (error) {
    console.error("Error analyzing sales data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/dashboard/total-profit", async (req, res) => {
  try {
    const result = await SaleOrder.aggregate([
      {
        $match: { status: "Completed" },
      },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: "$profit" },
        },
      },
    ]);

    res.json({ totalProfit: result[0]?.totalProfit || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});
module.exports = router;
