const paginationParams = [
  { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
  { name: "q", in: "query", schema: { type: "string" }, description: "Search query" },
  { name: "sort", in: "query", schema: { type: "string" }, description: "Sort field" },
  { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"] }, description: "Sort order" },
];

const idParam = { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Resource ID" };

const errorResponse = {
  description: "Error",
  content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
};

const successResponse = (schemaRef: string, list = false) => ({
  description: "Success",
  content: {
    "application/json": {
      schema: list
        ? {
            type: "object",
            properties: {
              response: { type: "string", example: "success" },
              data: { type: "array", items: { $ref: schemaRef } },
              count: { type: "integer" },
              page: { type: "integer" },
              totalPages: { type: "integer" },
            },
          }
        : {
            type: "object",
            properties: {
              response: { type: "string", example: "success" },
              data: { $ref: schemaRef },
            },
          },
    },
  },
});

function crudPaths(
  tag: string,
  basePath: string,
  schemaRef: string,
  extraListParams: Record<string, unknown>[] = []
) {
  return {
    [basePath]: {
      get: {
        tags: [tag],
        summary: `List all ${tag.toLowerCase()}`,
        parameters: [...paginationParams, ...extraListParams],
        responses: { 200: successResponse(schemaRef, true), 500: errorResponse },
      },
      post: {
        tags: [tag],
        summary: `Create ${tag.toLowerCase().replace(/s$/, "")}`,
        requestBody: { required: true, content: { "application/json": { schema: { $ref: schemaRef } } } },
        responses: { 200: successResponse(schemaRef), 500: errorResponse },
      },
    },
    [`${basePath}/{id}`]: {
      get: {
        tags: [tag],
        summary: `Get ${tag.toLowerCase().replace(/s$/, "")} by ID`,
        parameters: [idParam],
        responses: { 200: successResponse(schemaRef), 404: errorResponse, 500: errorResponse },
      },
      put: {
        tags: [tag],
        summary: `Update ${tag.toLowerCase().replace(/s$/, "")}`,
        parameters: [idParam],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: schemaRef } } } },
        responses: { 200: successResponse(schemaRef), 404: errorResponse, 500: errorResponse },
      },
      delete: {
        tags: [tag],
        summary: `Delete ${tag.toLowerCase().replace(/s$/, "")}`,
        parameters: [idParam],
        responses: { 200: { description: "Deleted" }, 500: errorResponse },
      },
    },
  };
}

export const spec = {
  openapi: "3.0.0",
  info: {
    title: "Dial A Drink Kenya - Admin API",
    version: "1.0.0",
    description: "Admin API for managing products, categories, orders, and more.",
  },
  servers: [{ url: "/api/admin", description: "Admin API" }],
  tags: [
    { name: "Products", description: "Product management" },
    { name: "Categories", description: "Category management" },
    { name: "Subcategories", description: "Subcategory management" },
    { name: "Brands", description: "Brand management" },
    { name: "Orders", description: "Order management" },
    { name: "Price Options", description: "Price option management" },
    { name: "Upload", description: "Image upload" },
  ],
  paths: {
    ...crudPaths("Products", "/products", "#/components/schemas/Product", [
      { name: "state", in: "query", schema: { type: "string", enum: ["published", "draft", "archived"] } },
      { name: "category", in: "query", schema: { type: "string" }, description: "Filter by category ID" },
      { name: "brand", in: "query", schema: { type: "string" }, description: "Filter by brand ID" },
    ]),
    ...crudPaths("Categories", "/categories", "#/components/schemas/Category"),
    ...crudPaths("Subcategories", "/subcategories", "#/components/schemas/Subcategory"),
    ...crudPaths("Brands", "/brands", "#/components/schemas/Brand"),
    "/orders": {
      get: {
        tags: ["Orders"],
        summary: "List all orders",
        parameters: [
          ...paginationParams,
          { name: "state", in: "query", schema: { type: "string" }, description: "Filter by order state" },
        ],
        responses: { 200: successResponse("#/components/schemas/Order", true), 500: errorResponse },
      },
    },
    "/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Get order by ID",
        parameters: [idParam],
        responses: { 200: successResponse("#/components/schemas/Order"), 404: errorResponse, 500: errorResponse },
      },
      put: {
        tags: ["Orders"],
        summary: "Update order (state and payment only)",
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  state: { type: "string" },
                  payment: { type: "object" },
                },
              },
            },
          },
        },
        responses: { 200: successResponse("#/components/schemas/Order"), 404: errorResponse, 500: errorResponse },
      },
    },
    "/price-options": {
      post: {
        tags: ["Price Options"],
        summary: "Create price option",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId", "optionText", "price"],
                properties: {
                  productId: { type: "string" },
                  optionText: { type: "string" },
                  price: { type: "number" },
                  offerPrice: { type: "number" },
                  currency: { type: "string", default: "KES" },
                  inStock: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: { 200: successResponse("#/components/schemas/PriceOption"), 500: errorResponse },
      },
    },
    "/price-options/{id}": {
      put: {
        tags: ["Price Options"],
        summary: "Update price option",
        parameters: [idParam],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PriceOption" } } },
        },
        responses: { 200: successResponse("#/components/schemas/PriceOption"), 500: errorResponse },
      },
      delete: {
        tags: ["Price Options"],
        summary: "Delete price option",
        parameters: [idParam],
        responses: { 200: { description: "Deleted" }, 500: errorResponse },
      },
    },
    "/upload": {
      post: {
        tags: ["Upload"],
        summary: "Upload image to Cloudinary",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary", description: "Image file (max 5MB)" },
                  folder: { type: "string", default: "products" },
                },
              },
            },
          },
        },
        responses: { 200: successResponse("#/components/schemas/CloudinaryImage"), 400: errorResponse, 500: errorResponse },
      },
      delete: {
        tags: ["Upload"],
        summary: "Delete image from Cloudinary",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { publicId: { type: "string" } } } } },
        },
        responses: { 200: { description: "Deleted" }, 500: errorResponse },
      },
    },
  },
  components: {
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          response: { type: "string", example: "error" },
          message: { type: "string" },
        },
      },
      Product: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          href: { type: "string", description: "URL slug" },
          description: { type: "string", description: "HTML content" },
          price: { type: "number" },
          currency: { type: "string", enum: ["KES", "USD"] },
          state: { type: "string", enum: ["published", "draft", "archived"] },
          category: { type: "string", description: "Category ID" },
          subCategory: { type: "string", description: "Subcategory ID" },
          brand: { type: "string", description: "Brand ID" },
          alcoholContent: { type: "number" },
          countryOfOrigin: { type: "string" },
          image: { $ref: "#/components/schemas/CloudinaryImage" },
          altImages: { type: "array", items: { $ref: "#/components/schemas/CloudinaryImage" } },
          priceOptions: { type: "array", items: { $ref: "#/components/schemas/PriceOption" } },
          tags: { type: "array", items: { type: "string" } },
          onOffer: { type: "boolean" },
          isPopular: { type: "boolean" },
          isBrandFocus: { type: "boolean" },
          inStock: { type: "boolean" },
          isGiftPack: { type: "boolean" },
          youtubeUrl: { type: "string" },
          pageTitle: { type: "string" },
          keyWords: { type: "string" },
          publishedDate: { type: "string", format: "date-time" },
          modifiedDate: { type: "string", format: "date-time" },
        },
      },
      Category: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          key: { type: "string" },
          href: { type: "string" },
          state: { type: "string", enum: ["published", "draft"] },
          description: { type: "string" },
          pageTitle: { type: "string" },
          modifiedDate: { type: "string", format: "date-time" },
        },
      },
      Subcategory: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          key: { type: "string" },
          category: { type: "string", description: "Category ID" },
          description: { type: "string" },
        },
      },
      Brand: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          href: { type: "string" },
          image: { $ref: "#/components/schemas/CloudinaryImage" },
        },
      },
      Order: {
        type: "object",
        properties: {
          _id: { type: "string" },
          orderNumber: { type: "string" },
          key: { type: "string" },
          state: { type: "string" },
          delivery: {
            type: "object",
            properties: {
              firstName: { type: "string" },
              lastName: { type: "string" },
              phoneNumber: { type: "string" },
              location: { type: "string" },
              address: { type: "string" },
            },
          },
          items: { type: "array", items: { type: "object" } },
          payment: { type: "object" },
          orderDate: { type: "string", format: "date-time" },
          modifiedDate: { type: "string", format: "date-time" },
        },
      },
      PriceOption: {
        type: "object",
        properties: {
          _id: { type: "string" },
          optionText: { type: "string" },
          price: { type: "number" },
          offerPrice: { type: "number" },
          currency: { type: "string" },
          inStock: { type: "boolean" },
        },
      },
      CloudinaryImage: {
        type: "object",
        properties: {
          public_id: { type: "string" },
          version: { type: "integer" },
          width: { type: "integer" },
          height: { type: "integer" },
          format: { type: "string" },
          url: { type: "string" },
          secure_url: { type: "string" },
        },
      },
    },
  },
};
