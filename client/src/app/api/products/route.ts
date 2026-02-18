import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { parseSort } from "@/lib/parseSort";

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     description: Retrieve a list of products with optional filtering and pagination
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const category = searchParams.get("category");
    const search = searchParams.get("search") || searchParams.get("q");
    const sort = searchParams.get("sort") || "popularity";
    const brand = searchParams.get("brand");
    const onOffer = searchParams.get("onOffer");

    // Build query
    const query: Record<string, unknown> = {
      state: "published",
      inStock: true,
    };

    if (category) {
      query.category = category;
    }

    if (brand) {
      query.brand = brand;
    }

    if (onOffer === "true") {
      query.onOffer = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Build sort
    const sortQuery = parseSort(sort, { popularity: -1, popularityRatio: -1 });
    const isPriceSort = sortQuery.price !== undefined;

    const skip = (page - 1) * pageSize;

    let products;
    let total: number;

    if (isPriceSort) {
      const dir = sortQuery.price as 1 | -1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pipeline: any[] = [
        { $match: query },
        {
          $lookup: {
            from: "productpriceoptions",
            localField: "priceOptions",
            foreignField: "_id",
            as: "_opts",
          },
        },
        {
          $addFields: {
            _sortPrice: {
              $cond: {
                if: { $gt: [{ $size: "$_opts" }, 0] },
                then: { $min: "$_opts.price" },
                else: "$price",
              },
            },
          },
        },
        { $sort: { _sortPrice: dir } },
        { $skip: skip },
        { $limit: pageSize },
        { $project: { _opts: 0, _sortPrice: 0 } },
      ];

      const [rawProducts, count] = await Promise.all([
        Product.aggregate(pipeline),
        Product.countDocuments(query),
      ]);

      products = await Product.populate(rawProducts, [
        { path: "category", select: "name key" },
        { path: "brand", select: "name href" },
        { path: "priceOptions" },
      ]);
      total = count;
    } else {
      const [found, count] = await Promise.all([
        Product.find(query)
          .populate("category", "name key")
          .populate("brand", "name href")
          .populate("priceOptions")
          .sort(sortQuery)
          .skip(skip)
          .limit(pageSize)
          .lean(),
        Product.countDocuments(query),
      ]);
      products = found;
      total = count;
    }

    return NextResponse.json({
      response: "success",
      data: products,
      count: total,
      page,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Products API Error:", error);
    return NextResponse.json(
      { response: "error", message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
