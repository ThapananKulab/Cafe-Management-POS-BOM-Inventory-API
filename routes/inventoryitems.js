const express = require("express");
const router = express.Router();
const Recipe = require("../models/Recipe");
const InventoryItem = require("../models/InventoryItem.js");

const { notifyLine } = require("../function/notify.js");
const tokenline = "DWTW5lpLAyy8v2zXVMeKaLenXJZBei9Zs7YXeoDqdxO";

router.put("/islower/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { islower } = req.body;
    const updatedItem = await InventoryItem.findByIdAndUpdate(
      id,
      { islower },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // ส่งการแจ้งเตือนไปยังไลน์
    const text = `ชื่อ ${updatedItem.name} ได้มีการอัปเดต ปริมาณ ขั้นต่ำ: ${islower}`;
    await notifyLine(tokenline, text);

    res.json({ message: "Item updated successfully" });
  } catch (error) {
    console.error("Error updating data:", error);
    res.status(500).json({ message: "Error updating item" });
  }
});

router.get("/all", async (req, res) => {
  try {
    const items = await InventoryItem.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/dashboard/all", async (req, res) => {
  try {
    const items = await InventoryItem.find();
    const itemCount = items.length;
    res.json({ itemCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/nearEmpty", async (req, res) => {
  try {
    const nearEmptyItems = await InventoryItem.find();
    const filteredItems = nearEmptyItems.filter(
      (item) => item.quantityInStock <= item.islower
    );
    res.json(filteredItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new inventory item
router.post("/add", async (req, res) => {
  const {
    name,
    type,
    unit,
    realquantity,
    quantityInStock,
    unitPrice,
    islower,
    costPerUnit,
  } = req.body;
  const item = new InventoryItem({
    name,
    type,
    unit,
    realquantity,
    quantityInStock,
    unitPrice,
    islower,
    costPerUnit,
  });

  try {
    const newItem = await item.save();
    const text = `วัตถุดิบ ชื่อ ${name}, ประเภท ${type}, หน่วย ${unit}, จำนวนจริง ${realquantity}, จำนวนในสต็อก ${quantityInStock}, ราคาต่อหน่วย ${unitPrice} บาท ถูกเพิ่ม`;
    await notifyLine(tokenline, text);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Delete an inventory item
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await InventoryItem.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({ message: "No item found with that ID." });
    }

    res
      .status(200)
      .json({ message: "Item deleted successfully.", item: deletedItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/update-stock/:id", async (req, res) => {
  const { id } = req.params;
  const { adjustment } = req.body;

  try {
    const item = await InventoryItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: "No item found with that ID." });
    }
    item.quantityInStock += adjustment;
    const updatedItem = await item.save();
    res.status(200).json({
      message: `${item.name} เพิ่มไป ${adjustment}. จำนวนคงเหลือ ${updatedItem.quantityInStock}.`,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/adjust-stock/:id", async (req, res) => {
  const { id } = req.params;
  const { adjustment } = req.body;

  try {
    const item = await InventoryItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: "No item found with that ID." });
    }
    item.quantityInStock -= adjustment;
    const updatedItem = await item.save();
    res.status(200).json({
      message: `${item.name} เพิ่มไป ${adjustment}. จำนวนคงเหลือ ${updatedItem.quantityInStock}.`,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/update/:id", async (req, res) => {
  const { id } = req.params;
  const { name, type, unit, realquantity, quantityInStock, unitPrice } =
    req.body;

  try {
    const oldItem = await InventoryItem.findById(id);

    if (!oldItem) {
      return res.status(404).json({ message: "Inventory item not found." });
    }

    const updatedItem = await InventoryItem.findByIdAndUpdate(
      id,
      { name, type, unit, realquantity, quantityInStock, unitPrice },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Inventory item not found." });
    }

    // เปรียบเทียบข้อมูลก่อนและหลังการอัพเดต
    const changes = [];
    if (oldItem.name !== updatedItem.name) {
      changes.push(`ชื่อ: ${oldItem.name} เป็น ${updatedItem.name}`);
    }
    if (oldItem.type !== updatedItem.type) {
      changes.push(`ประเภท: ${oldItem.type} เป็น ${updatedItem.type}`);
    }
    if (oldItem.unit !== updatedItem.unit) {
      changes.push(`หน่วย: ${oldItem.unit} เป็น ${updatedItem.unit}`);
    }
    if (oldItem.realquantity !== updatedItem.realquantity) {
      changes.push(
        `จำนวนใน Stock: ${oldItem.realquantity} เป็น ${updatedItem.realquantity}`
      );
    }
    if (oldItem.quantityInStock !== updatedItem.quantityInStock) {
      changes.push(
        `จำนวนในสต๊อก: ${oldItem.quantityInStock} เป็น ${updatedItem.quantityInStock}`
      );
    }
    if (oldItem.unitPrice !== updatedItem.unitPrice) {
      changes.push(
        `ราคาต่อหน่วย: ${oldItem.unitPrice} เป็น ${updatedItem.unitPrice}`
      );
    }

    // ส่งข้อมูลเกี่ยวกับการเปลี่ยนแปลงและข้อมูลเดิมไปยัง Line Bot
    if (changes.length > 0) {
      const text = `วัตถุดิบชื่อ "${
        updatedItem.name
      }" ถูกแก้ไข:\n${changes.join("\n")}`;
      await notifyLine(tokenline, text);
    }

    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  console.log(req.params.id);
  InventoryItem.findById(req.params.id)
    .then((inventoryItem) => {
      res.json(inventoryItem);
    })
    .catch((err) => {
      next(err);
    });
});

router.delete("/inventory/delete/:inventoryItemId", async (req, res) => {
  try {
    const { inventoryItemId } = req.params;
    const isUsedInRecipe = await Recipe.findOne({
      "ingredients.inventoryItemId": inventoryItemId,
    });

    if (isUsedInRecipe) {
      return res.status(400).json({
        message: "Cannot delete: This inventory item is being used in recipes.",
      });
    }

    const itemToBeDeleted = await InventoryItem.findById(inventoryItemId);

    if (!itemToBeDeleted) {
      return res
        .status(404)
        .json({ message: "No inventory item found with that ID." });
    }

    const text = `ID ${inventoryItemId}, ชื่อวัตถุดิบ ${itemToBeDeleted.name} ถูกลบ`;
    await notifyLine(tokenline, text);

    const deletedItem = await InventoryItem.findByIdAndDelete(inventoryItemId);
    console.log("Deleted item:", deletedItem);

    res
      .status(200)
      .json({ message: "Inventory item deleted successfully.", deletedItem });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/reduce-stock", async (req, res) => {
  const { orderId, quantity } = req.body;

  try {
    const inventoryItem = await InventoryItem.findOne({ orderId });

    if (!inventoryItem) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    if (inventoryItem.quantityInStock < quantity) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    inventoryItem.quantityInStock -= quantity;

    await inventoryItem.save();

    res.status(200).json({ message: "Stock reduced successfully" });
  } catch (error) {
    console.error("Error reducing stock:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
