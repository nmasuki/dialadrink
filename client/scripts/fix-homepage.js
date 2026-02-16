const mongoose = require("mongoose");

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/dial-a-drink-kenya");
  console.log("Connected");

  const result = await mongoose.connection.collection("pages").updateOne(
    { _id: new mongoose.Types.ObjectId("5b48e94fbdd218570be62277") },
    { $set: {
      title: "Alcohol Delivery Nairobi | Dial A Drink Kenya",
      h1: "Alcohol Delivery in Nairobi \u2014 Order Drinks Online",
      meta: "Order alcohol online in Nairobi. Whisky, beer, wine and spirits delivered fast. Call 0723688108. Dial A Drink Kenya.",
      href: "/"
    }}
  );
  console.log("Updated:", result.modifiedCount, "document(s)");
  await mongoose.disconnect();
}

main().catch(console.error);
