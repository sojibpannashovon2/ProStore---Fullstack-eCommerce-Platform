CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");
CREATE INDEX "Product_isFeatured_createdAt_idx" ON "Product"("isFeatured", "createdAt");
CREATE INDEX "Product_category_createdAt_idx" ON "Product"("category", "createdAt");
CREATE INDEX "Product_price_idx" ON "Product"("price");
CREATE INDEX "Product_rating_idx" ON "Product"("rating");
CREATE INDEX "Review_productId_createdAt_idx" ON "Review"("productId", "createdAt");
