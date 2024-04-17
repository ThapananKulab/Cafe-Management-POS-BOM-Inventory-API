const express = require("express");
const router = express.Router();
const PurchaseReceipt = require("../models/PuchaseItem.js");
const InventoryItem = require("../models/InventoryItem.js");

router.put("/:purchaseReceiptId/items/:itemId", async (req, res) => {
  try {
    const { purchaseReceiptId, itemId } = req.params;
    const { status } = req.body;

    const purchaseReceipt = await PurchaseReceipt.findById(purchaseReceiptId);
    if (!purchaseReceipt) {
      return res.status(404).json({ message: "Purchase receipt not found" });
    }

    console.log("Before update:");
    console.log(purchaseReceipt);

    const itemToUpdate = purchaseReceipt.items.find(
      (item) => item._id.toString() === itemId
    );
    if (!itemToUpdate) {
      return res
        .status(404)
        .json({ message: "Item not found in the purchase receipt" });
    }

    console.log("Before update:");
    console.log(itemToUpdate);

    itemToUpdate.status = status;
    await purchaseReceipt.save(); // บันทึกการเปลี่ยนแปลงที่ทำไว้ใน purchaseReceipt

    console.log("After update:");
    console.log(purchaseReceipt);

    res.status(200).json({ message: "Item status updated successfully" });
  } catch (error) {
    console.error("Error updating item status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//
router.post("/add-to-q", async (req, res) => {
  try {
    const {
      purchaseReceiptId,
      selectedItemIds,
      status,
      received,
      withdrawner,
    } = req.body;
    const purchaseReceipt = await PurchaseReceipt.findById(purchaseReceiptId);
    if (!purchaseReceipt) {
      return res.status(404).json({ message: "Purchase receipt not found" });
    }

    const selectedItems = purchaseReceipt.items.filter((item) =>
      selectedItemIds.includes(item.item.toString())
    );
    selectedItems.forEach((item) => {
      item.status = "withdrawn";
      item.received = new Date();
      item.withdrawner = withdrawner;
    });

    await purchaseReceipt.save();

    for (const itemId of selectedItemIds) {
      const { quantity, realquantity } = selectedItems.find(
        (item) => item.item.toString() === itemId
      );
      const updatedItem = await InventoryItem.findByIdAndUpdate(
        itemId,
        {
          status: "withdrawn",
          received: received,
          $inc: { quantityInStock: quantity * realquantity },
        },
        { new: true, upsert: true }
      );
      console.log(
        `Updated status, received, and quantityInStock for item ${itemId} to withdrawn ${received}`
      );
    }

    res.status(201).json({ message: "Items added to inventory successfully" });
  } catch (error) {
    console.error("Error adding items to inventory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/pending", async (req, res) => {
  try {
    const pendingReceipts = await PurchaseReceipt.find({
      status: "pending",
    }).populate("items.item");
    res.json(pendingReceipts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/add-purchase", async (req, res) => {
  const { purchaseId, items } = req.body;
  try {
    const purchaseReceipt = await PurchaseReceipt.findById(purchaseId).populate(
      "items.item"
    );
    if (!purchaseReceipt) {
      return res.status(404).json({ message: "Purchase receipt not found" });
    }
    for (const requestedItem of items) {
      const purchaseItem = purchaseReceipt.items.find(
        (item) => item.item._id.toString() === requestedItem.itemId
      );
      if (!purchaseItem) {
        return res.status(400).json({
          message: `Item with ID ${requestedItem.itemId} not found in the purchase receipt`,
        });
      }
      const inventoryItem = await InventoryItem.findById(purchaseItem.item._id);
      if (!inventoryItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      if (isNaN(requestedItem.quantity) || requestedItem.quantity <= 0) {
        return res.status(400).json({
          message: `Invalid quantity for item ${inventoryItem.name}`,
        });
      }
      const stockToAdd = purchaseItem.realquantity * requestedItem.quantity;
      inventoryItem.quantityInStock += stockToAdd;
      await inventoryItem.save();

      // Update the status of the purchase item to 'withdrawn'
      purchaseItem.status = "withdrawn";
    }
    // Save the updated purchase receipt
    await purchaseReceipt.save();

    res.status(201).json({ message: "Data withdrawn successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/add-to-withdrawn", async (req, res) => {
  try {
    const { purchaseReceiptId, selectedItemIds } = req.body;

    const purchaseReceipt = await PurchaseReceipt.findById(purchaseReceiptId);
    if (!purchaseReceipt) {
      return res.status(404).json({ message: "Purchase receipt not found" });
    }

    for (const item of purchaseReceipt.items) {
      const { item: itemId, quantity, realquantity, status } = item;

      // ตรวจสอบว่าไอเท็มนี้อยู่ในรายการไอเท็มที่ถูกกดหรือไม่
      if (!selectedItemIds.includes(itemId.toString())) {
        continue; // ถ้าไม่ใช่ ข้ามไปยังไอเท็มถัดไป
      }

      if (
        typeof quantity !== "number" ||
        typeof realquantity !== "number" ||
        isNaN(quantity) ||
        isNaN(realquantity)
      ) {
        console.error(
          `Invalid quantity or realquantity for item with ID: ${itemId}`
        );
        continue;
      }
      const quantityToAdd = quantity * realquantity;
      await InventoryItem.findByIdAndUpdate(
        itemId,
        {
          $inc: { quantityInStock: quantityToAdd },
          $set: { status: "withdrawn" },
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({ message: "Items added to inventory successfully" });
  } catch (error) {
    console.error("Error adding items to inventory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/add-to-inventory", async (req, res) => {
  try {
    const { purchaseReceiptId } = req.body;

    const purchaseReceipt = await PurchaseReceipt.findById(purchaseReceiptId);
    if (!purchaseReceipt) {
      return res.status(404).json({ message: "Purchase receipt not found" });
    }

    for (const item of purchaseReceipt.items) {
      const { item: itemId, quantity, realquantity } = item;

      if (
        typeof quantity !== "number" ||
        typeof realquantity !== "number" ||
        isNaN(quantity) ||
        isNaN(realquantity)
      ) {
        console.error(
          `Invalid quantity or realquantity for item with ID: ${itemId}`
        );
        continue;
      }

      await InventoryItem.findByIdAndUpdate(
        itemId,
        { $inc: { quantityInStock: quantity * realquantity } },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({ message: "Items added to inventory successfully" });
  } catch (error) {
    console.error("Error adding items to inventory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/add", async (req, res) => {
  try {
    const { items, supplier } = req.body;
    const total = items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0
    );
    const purchaseReceipt = new PurchaseReceipt({
      items,
      total,
      supplier,
    });
    await purchaseReceipt.save();
    items.forEach(async (item) => {
      const inventoryItem = await InventoryItem.findById(item._id);
      if (inventoryItem) {
        inventoryItem.quantityInStock += item.quantity;
        await inventoryItem.save();
      }
    });

    res.status(201).json(purchaseReceipt);
  } catch (error) {
    console.error("Error creating purchase receipt:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/purchase-receipts", async (req, res) => {
  try {
    const purchaseReceipts = await PurchaseReceipt.find();
    res.json(purchaseReceipts);
  } catch (error) {
    console.error("Error fetching purchase receipts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/all", async (req, res) => {
  try {
    const receipts = await PurchaseReceipt.find().populate("items.item");
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
