# GraphQL API Payload Guide

GraphQL endpoint:

- `http://localhost:5000/graphql`

For protected APIs, send header:

- `Authorization: Bearer <ACCESS_TOKEN>`

## API Response Format

All API responses now follow this standard format:

```json
{
  "data": {
    "operationName": {
      "statusCode": 200,
      "message": "Operation completed successfully",
      "data": { ... }
    }
  }
}
```

## Authentication APIs

### 1) Register User

```graphql
mutation RegisterUser {
  register(
    input: {
      firstName: "John"
      lastName: "Doe"
      email: "john@example.com"
      password: "Pass@123"
      mobile: "9876543210"
      roleId: "1"
    }
  ) {
    statusCode
    message
    data {
      id
      firstName
      lastName
      email
      mobile
      isVerified
      adminApproved
      createdAt
      role {
        id
      }
    }
  }
}
```

### 2) Login

```graphql
mutation Login {
  login(input: { email: "john@example.com", password: "Pass@123" }) {
    statusCode
    message
    data {
      accessToken
      user {
        id
        firstName
        lastName
        email
        mobile
        isVerified
        adminApproved
        createdAt
        role {
          id
          name
          permissions {
            id
            name
          }
        }
      }
    }
  }
}
```

**Important:** The `accessToken` and `user` fields are nested inside the `data` field. Do not query them directly from the login response.

**Simplified Test Query:**

```graphql
mutation LoginTest {
  login(input: { email: "john@example.com", password: "Pass@123" }) {
    statusCode
    message
    data {
      accessToken
    }
  }
}
```

## User Management APIs

### 3) Get All User Profiles (Admin Only)

**Requires Permission:** `READ_USER` (Admin functionality)

```graphql
query GetAllUserProfiles {
  getAllUserProfiles(
    filters: {
      page: 1
      limit: 10
      search: "john"
      roleIds: ["role-uuid-1", "role-uuid-2"]
      isVerified: true
      adminApproved: true
      sortBy: "createdAt"
      sortOrder: "DESC"
    }
  ) {
    statusCode
    message
    data {
      users {
        id
        firstName
        lastName
        email
        mobile
        isVerified
        adminApproved
        createdAt
        role {
          id
          name
        }
      }
      total
      page
      limit
      totalPages
    }
  }
}
```

**Filter Options:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search in firstName, lastName, email, mobile
- `roleIds`: Filter by role IDs array
- `isVerified`: Filter by verification status
- `adminApproved`: Filter by admin approval status
- `sortBy`: Sort by field (createdAt, firstName, lastName, email)
- `sortOrder`: Sort order (ASC, DESC)

### 4) Get User Profile By Id (Admin Only)

**Requires Permission:** `READ_USER` (Admin functionality)

```graphql
query GetUserProfileById {
  getUserProfileById(id: "USER_ID_HERE") {
    statusCode
    message
    data {
      id
      firstName
      lastName
      email
      mobile
      isVerified
      adminApproved
      createdAt
      role {
        id
        name
      }
    }
  }
}
```

### 5) Get User By ID (Admin Only)

**Requires Permission:** `READ_USER` (Admin functionality)

```graphql
query GetUserById {
  getUserById(id: "USER_ID_HERE") {
    statusCode
    message
    data {
      id
      firstName
      lastName
      email
      mobile
      isVerified
      adminApproved
      createdAt
      role {
        id
        name
      }
    }
  }
}
```

### 6) Delete User (Admin Only)

**Requires Permission:** `DELETE_USER` (Admin functionality)

```graphql
mutation DeleteUser {
  deleteUser(id: "USER_ID_HERE") {
    statusCode
    message
    data
  }
}
```

### 7) Approve User (Admin Only)

**Requires Permission:** `UPDATE_USER` (Admin functionality)

```graphql
mutation ApproveUser {
  approveUser(id: "USER_ID_HERE") {
    statusCode
    message
    data {
      id
      firstName
      lastName
      email
      mobile
      isVerified
      adminApproved
      createdAt
      role {
        id
        name
      }
    }
  }
}
```

### 5) Get Current User Profile (Protected)

```graphql
query GetCurrentUserProfile {
  getCurrentUserProfile {
    id
    firstName
    lastName
    email
    mobile
    isVerified
    adminApproved
    createdAt
    role {
      id
    }
  }
}
```

### 6) User Profile (Protected, Email Cannot Be Updated)

```graphql
mutation UpdateUserProfile {
  updateUserProfile(
    input: {
      firstName: "Johnny"
      lastName: "D"
      mobile: "9999999999"
      password: "NewPass@123"
    }
  ) {
    id
    firstName
    lastName
    email
    mobile
    isVerified
    adminApproved
    createdAt
    role {
      id
    }
  }
}
```

### 7) Verify OTP

```graphql
mutation VerifyOtp {
  verifyOtp(input: { email: "john@example.com", otp: "123456" }) {
    statusCode
    message
    data
  }
}
```

### 8) Forgot Password

```graphql
mutation ForgotPassword {
  forgotPassword(email: "john@example.com") {
    statusCode
    message
    data
  }
}
```

### 9) Reset Password

```graphql
mutation ResetPassword {
  resetPassword(
    input: {
      email: "john@example.com"
      otp: "123456"
      newPassword: "NewPass@123"
    }
  ) {
    statusCode
    message
    data
  }
}
```

### 10) Resend OTP

```graphql
mutation ResendOtp {
  resendOtp(email: "john@example.com") {
    statusCode
    message
    data
  }
}
```

## Shop Management APIs

### 11) Create Shop

**Requires Authentication:** Yes (JWT Token Required)
**Requires Role:** `admin`
**Requires Permission:** `CREATE_SHOP`

```graphql
mutation CreateShop {
  createShop(
    input: {
      shopName: "SwiftMart Electronics"
      addressLine1: "123 Main Street"
      addressLine2: "Floor 2, Building A"
      city: "Mumbai"
      state: "Maharashtra"
      pinCode: "400001"
      country: "India"
      pickupAddress: "Warehouse Gate 3, Industrial Area"
      gstNumber: "27AAAPL1234C1ZV"
      panNumber: "AAAPL1234C"
      businessRegistrationNumber: "U72300MH2023PTC123456"
      fssaiNumber: "12345678901234"
      accountHolderName: "John Doe"
      accountNumber: "1234567890123456"
      ifscCode: "SBIN0001234"
      bankName: "State Bank of India"
      cancelledChequeImage: "https://example.com/cheque.jpg"
      alternatePhone: "9876543210"
      whatsappNumber: "9876543210"
      websiteUrl: "https://swiftmart.com"
      instagram: "@swiftmart_official"
      facebook: "SwiftMart Electronics"
      shopLicense: "https://example.com/license.pdf"
    }
  ) {
    statusCode
    message
    data {
      id
      shopName
      addressLine1
      addressLine2
      city
      state
      pinCode
      country
      pickupAddress
      gstNumber
      panNumber
      businessRegistrationNumber
      fssaiNumber
      accountHolderName
      accountNumber
      ifscCode
      bankName
      cancelledChequeImage
      alternatePhone
      whatsappNumber
      websiteUrl
      instagram
      facebook
      sellerId
      createdAt
      shopLicense
      seller {
        id
        firstName
        lastName
        email
      }
    }
  }
}
```

### 12) Get All Shops

**Requires Authentication:** Yes (JWT Token Required)
**Requires Permission:** `READ_SHOP`

```graphql
query GetAllShops {
  getAllShops {
    statusCode
    message
    data {
      id
      shopName
      addressLine1
      city
      state
      pinCode
      country
      gstNumber
      accountHolderName
      bankName
      sellerId
      createdAt
      seller {
        id
        firstName
        lastName
        email
      }
    }
  }
}
```

### 13) Get Shop By ID

**Requires Authentication:** Yes (JWT Token Required)
**Requires Permission:** `READ_SHOP`

```graphql
query GetShopById {
  getShopbyId(id: "SHOP_ID_HERE") {
    statusCode
    message
    data {
      id
      shopName
      addressLine1
      addressLine2
      city
      state
      pinCode
      country
      pickupAddress
      gstNumber
      panNumber
      businessRegistrationNumber
      fssaiNumber
      accountHolderName
      accountNumber
      ifscCode
      bankName
      cancelledChequeImage
      alternatePhone
      whatsappNumber
      websiteUrl
      instagram
      facebook
      sellerId
      createdAt
      shopLicense
      seller {
        id
        firstName
        lastName
        email
        mobile
      }
    }
  }
}
```

### 14) Update Shop

**Requires Authentication:** Yes (JWT Token Required)
**Requires Permission:** `UPDATE_SHOP`

```graphql
mutation UpdateShop {
  updateShopById(
    input: {
      id: "SHOP_ID_HERE"
      shopName: "Updated SwiftMart Electronics"
      addressLine1: "456 Updated Street"
      city: "Pune"
      state: "Maharashtra"
      pinCode: "411001"
      whatsappNumber: "9876543211"
      websiteUrl: "https://updated-swiftmart.com"
    }
  ) {
    statusCode
    message
    data {
      id
      shopName
      addressLine1
      city
      state
      pinCode
      whatsappNumber
      websiteUrl
      createdAt
    }
  }
}
```

### 15) Delete Shop

**Requires Authentication:** Yes (JWT Token Required)
**Requires Permission:** `DELETE_SHOP`

```graphql
mutation DeleteShop {
  deleteShopById(id: "SHOP_ID_HERE") {
    statusCode
    message
    data
  }
}
```

## Role Management APIs

### 11) Create Role

**Requires Permission:** `CREATE_USER` (Admin functionality)

```graphql
mutation CreateRole {
  createRole(name: "admin") {
    statusCode
    message
    data {
      id
      name
    }
  }
}
```

### 12) Get All Roles

**Requires Permission:** `READ_USER`

```graphql
query GetRoles {
  getRoles(
    filters: {
      page: 1
      limit: 10
      search: "admin"
      permissionIds: ["perm-uuid-1", "perm-uuid-2"]
      sortBy: "name"
      sortOrder: "ASC"
    }
  ) {
    statusCode
    message
    data {
      roles {
        id
        name
        permissions {
          id
          name
        }
      }
      total
      page
      limit
      totalPages
    }
  }
}
```

**Filter Options:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search in role name
- `permissionIds`: Filter by permission IDs array
- `sortBy`: Sort by field (name, createdAt)
- `sortOrder`: Sort order (ASC, DESC)

### 13) Get Role By Id

**Requires Permission:** `READ_USER`

```graphql
query GetRole {
  getRole(id: "ROLE_ID_HERE") {
    id
    name
    permissions {
      id
      name
    }
  }
}
```

### 14) Update Role

**Requires Permission:** `UPDATE_USER`

```graphql
mutation UpdateRole {
  updateRole(id: "ROLE_ID_HERE", name: "super_admin") {
    statusCode
    message
    data {
      id
      name
    }
  }
}
```

### 15) Delete Role

**Requires Permission:** `DELETE_USER`

```graphql
mutation DeleteRole {
  deleteRole(id: "ROLE_ID_HERE")
}
```

## Permission Management APIs

### 16) Create Permission

**Requires Permission:** `CREATE_USER` (Admin functionality)

```graphql
mutation CreatePermission {
  createPermission(name: "CUSTOM_PERMISSION") {
    statusCode
    message
    data {
      id
      name
    }
  }
}
```

### 17) Update Permission

**Requires Permission:** `UPDATE_USER` (Admin functionality)

```graphql
mutation UpdatePermission {
  updatePermission(id: "PERMISSION_ID_HERE", name: "UPDATED_PERMISSION_NAME") {
    statusCode
    message
    data {
      id
      name
    }
  }
}
```

### 18) Get All Permissions

**Requires Permission:** `READ_USER` (Admin functionality)
**Requires Authentication:** Yes (JWT Token Required)

```graphql
query GetPermissions {
  getPermission(
    filters: {
      page: 1
      limit: 10
      search: "create"
      sortBy: "name"
      sortOrder: "ASC"
    }
  ) {
    statusCode
    message
    data {
      permissions {
        id
        name
      }
      total
      page
      limit
      totalPages
    }
  }
}
```

**Filter Options:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `search`: Search in permission name
- `sortBy`: Sort by field (name, createdAt)
- `sortOrder`: Sort order (ASC, DESC)

### 18) Get Permissions by Role

**Requires Permission:** `READ_USER`

```graphql
query GetPermissionsByRole {
  getPermissionByRole(roleId: "ROLE_ID_HERE") {
    statusCode
    message
    data {
      id
      name
    }
  }
}
```

### 19) Assign Permission to Role

**Requires Permission:** `UPDATE_USER`

```graphql
mutation AssignPermission {
  assignPermission(roleId: "ROLE_ID_HERE", permissionId: "PERMISSION_ID_HERE") {
    statusCode
    message
    data
  }
}
```

### 20) Remove Permission from Role

**Requires Permission:** `UPDATE_USER`

```graphql
mutation RemovePermission {
  removePermission(roleId: "ROLE_ID_HERE", permissionId: "PERMISSION_ID_HERE") {
    statusCode
    message
    data
  }
}
```

## Category Management APIs

### 21) Create Category

**Requires Permission:** `CREATE_CATEGORY`

```graphql
mutation CreateCategory {
  createCategory(
    input: { name: "Electronics", description: "Electronic items and gadgets" }
  ) {
    id
    name
    description
    subCategories {
      id
      name
    }
  }
}
```

### 22) Get All Categories

**Requires Permission:** `READ_CATEGORY`

```graphql
query GetCategories {
  getCategories {
    id
    name
    description
    subCategories {
      id
      name
    }
  }
}
```

### 23) Get Category By ID

**Requires Permission:** `READ_CATEGORY`

```graphql
query GetCategory {
  getCategory(id: "CATEGORY_ID_HERE") {
    id
    name
    description
    subCategories {
      id
      name
    }
  }
}
```

### 24) Update Category

**Requires Permission:** `UPDATE_CATEGORY`

```graphql
mutation UpdateCategory {
  updateCategory(
    input: {
      id: "CATEGORY_ID_HERE"
      name: "Updated Electronics"
      description: "Updated description"
    }
  ) {
    id
    name
    description
    subCategories {
      id
      name
    }
  }
}
```

### 25) Delete Category

**Requires Permission:** `DELETE_CATEGORY`

```graphql
mutation DeleteCategory {
  deleteCategory(id: "CATEGORY_ID_HERE")
}
```

## SubCategory Management APIs

### 26) Create SubCategory

**Requires Permission:** `CREATE_SUBCATEGORY`

```graphql
mutation CreateSubCategory {
  createSubCategory(
    input: { name: "Mobile Phones", categoryId: "CATEGORY_ID_HERE" }
  ) {
    id
    name
    category {
      id
      name
      description
    }
  }
}
```

### 27) Get All SubCategories

**Requires Permission:** `READ_SUBCATEGORY`

```graphql
query GetSubCategories {
  getSubCategories {
    id
    name
    category {
      id
      name
      description
    }
  }
}
```

### 28) Get SubCategory By ID

**Requires Permission:** `READ_SUBCATEGORY`

```graphql
query GetSubCategory {
  getSubCategory(id: "SUBCATEGORY_ID_HERE") {
    id
    name
    category {
      id
      name
      description
    }
  }
}
```

### 29) Update SubCategory

**Requires Permission:** `UPDATE_SUBCATEGORY`

```graphql
mutation UpdateSubCategory {
  updateSubCategory(
    input: { id: "SUBCATEGORY_ID_HERE", name: "Updated Mobile Phones" }
  ) {
    id
    name
    category {
      id
      name
      description
    }
  }
}
```

### 30) Delete SubCategory

**Requires Permission:** `DELETE_SUBCATEGORY`

```graphql
mutation DeleteSubCategory {
  deleteSubCategory(id: "SUBCATEGORY_ID_HERE") {
    id
    name
  }
}
```

**Note:** After deletion, the entity fields may return null. The operation confirms successful deletion.

### 27) Get All SubCategories

**Requires Permission:** `READ_SUBCATEGORY`

```graphql
query GetSubCategories {
  getSubCategories {
    id
    name
    createdAt
    updatedAt
    category {
      id
      name
    }
  }
}
```

### 28) Get SubCategory By ID

**Requires Permission:** `READ_SUBCATEGORY`

```graphql
query GetSubCategory {
  getSubCategory(id: "SUBCATEGORY_ID_HERE") {
    id
    name
    createdAt
    updatedAt
    category {
      id
      name
    }
  }
}
```

### 29) Update SubCategory

**Requires Permission:** `UPDATE_SUBCATEGORY`

```graphql
mutation UpdateSubCategory {
  updateSubCategory(input: { id: "SUBCATEGORY_ID_HERE", name: "Smartphones" }) {
    id
    name
    createdAt
    updatedAt
    category {
      id
      name
    }
  }
}
```

### 30) Delete SubCategory

**Requires Permission:** `DELETE_SUBCATEGORY`

```graphql
mutation DeleteSubCategory {
  deleteSubCategory(id: "SUBCATEGORY_ID_HERE")
}
```

## Tax Management APIs

### Create Tax

```graphql
mutation CreateTax {
  createTax(
    input: {
      categoryId: "CATEGORY_ID_HERE"
      taxRate: 18
      description: "Standard GST rate"
    }
  ) {
    id
    category {
      id
      name
    }
    categoryId
    taxRate
    description
    isActive
    createdAt
    updatedAt
  }
}
```

### Get All Taxes

```graphql
query GetTaxes {
  getTaxes {
    id
    category {
      id
      name
    }
    categoryId
    taxRate
    description
    isActive
    createdAt
    updatedAt
  }
}
```

### Get Tax By ID

```graphql
query GetTax {
  getTax(id: "TAX_ID_HERE") {
    id
    category {
      id
      name
    }
    categoryId
    taxRate
    description
    isActive
    createdAt
    updatedAt
  }
}
```

### Get Tax By Category

```graphql
query GetTaxByCategory {
  getTaxByCategory(categoryId: "CATEGORY_ID_HERE") {
    id
    category {
      id
      name
    }
    categoryId
    taxRate
    description
    isActive
    createdAt
    updatedAt
  }
}
```

**Note:** Returns `null` if no active tax is found for the category.

### Update Tax

```graphql
mutation UpdateTax {
  updateTax(
    input: {
      id: "TAX_ID_HERE"
      taxRate: 28
      description: "Increased GST rate"
      isActive: true
    }
  ) {
    id
    category {
      id
      name
    }
    categoryId
    taxRate
    description
    isActive
    createdAt
    updatedAt
  }
}
```

### Delete Tax

```graphql
mutation DeleteTax {
  deleteTax(id: "TAX_ID_HERE")
}
```

## Coupon Management APIs

### Create Coupon

```graphql
mutation CreateCoupon {
  createCoupon(
    input: {
      code: "SAVE10"
      discountType: PERCENTAGE
      discountValue: 10
      maxDiscountAmount: 50
      minOrderAmount: 100
      startDate: "2024-01-01"
      expiryDate: "2030-12-31"
      usageLimit: 100
      isActive: true
    }
  ) {
    id
    code
    discountType
    discountValue
    maxDiscountAmount
    minOrderAmount
    startDate
    expiryDate
    usageLimit
    usageCount
    isActive
    createdAt
    updatedAt
  }
}
```

**Note:** Requires `CREATE_COUPON` permission (admin only).

### Get All Coupons

```graphql
query GetCoupons {
  getCoupons {
    id
    code
    discountType
    discountValue
    maxDiscountAmount
    minOrderAmount
    startDate
    expiryDate
    usageLimit
    usageCount
    isActive
    createdAt
    updatedAt
  }
}
```

### Get Coupon By ID

```graphql
query GetCoupon {
  getCoupon(id: "COUPON_ID_HERE") {
    id
    code
    discountType
    discountValue
    maxDiscountAmount
    minOrderAmount
    startDate
    expiryDate
    usageLimit
    usageCount
    isActive
    createdAt
    updatedAt
  }
}
```

### Get Coupon By Code

```graphql
query GetCouponByCode {
  getCouponByCode(code: "SAVE10") {
    id
    code
    discountType
    discountValue
    maxDiscountAmount
    minOrderAmount
    startDate
    expiryDate
    usageLimit
    usageCount
    isActive
    createdAt
    updatedAt
  }
}
```

### Update Coupon

```graphql
mutation UpdateCoupon {
  updateCoupon(
    id: "COUPON_ID_HERE"
    input: { discountValue: 20, isActive: true }
  ) {
    id
    code
    discountType
    discountValue
    maxDiscountAmount
    minOrderAmount
    startDate
    expiryDate
    usageLimit
    usageCount
    isActive
    createdAt
    updatedAt
  }
}
```

**Note:** Requires `UPDATE_COUPON` permission (admin only).

### Delete Coupon

```graphql
mutation DeleteCoupon {
  deleteCoupon(id: "COUPON_ID_HERE")
}
```

**Note:** Requires `DELETE_COUPON` permission (admin only).

### Apply Coupon

```graphql
mutation ApplyCoupon {
  applyCoupon(input: { code: "SAVE10", orderAmount: 100 }) {
    coupon {
      id
      code
      discountType
      discountValue
      maxDiscountAmount
      minOrderAmount
    }
    discountAmount
    finalAmount
  }
}
```

## Product Management APIs

### 31) Create Product

**Requires Permission:** `CREATE_PRODUCT`

```graphql
mutation CreateProduct {
  createProduct(
    input: {
      name: "iPhone 15 Pro"
      description: "Latest iPhone model"
      longDescription: "The most advanced iPhone with titanium design"
      mrp: 99999
      sellingPrice: 89999
      discountPercentage: 10
      stockQuantity: 50
      isAvailable: true
      lowStockThreshold: 5
      unit: "pieces"
      unitValue: 1
      packSize: "1 piece"
      brand: "Apple"
      isVeg: true
      expiryDays: null
      images: ["image1.jpg", "image2.jpg"]
      shopId: "SHOP_ID_HERE"
      categoryId: "CATEGORY_ID_HERE"
      subCategoryId: "SUBCATEGORY_ID_HERE"
    }
  ) {
    id
    name
    description
    longDescription
    mrp
    sellingPrice
    discountPercentage
    stockQuantity
    isAvailable
    lowStockThreshold
    unit
    unitValue
    packSize
    brand
    isVeg
    expiryDays
    images
    createdAt
    updatedAt
    shop {
      id
      name
    }
    category {
      id
      name
    }
    subCategory {
      id
      name
    }
  }
}
```

### 32) Get All Products

**Requires Permission:** `READ_PRODUCT`

```graphql
query GetProducts {
  getProducts {
    id
    name
    description
    mrp
    sellingPrice
    stockQuantity
    isAvailable
    images
    createdAt
    updatedAt
    shop {
      id
      name
    }
    category {
      id
      name
    }
    subCategory {
      id
      name
    }
  }
}
```

### 33) Get Product By ID

**Requires Permission:** `READ_PRODUCT`

```graphql
query GetProduct {
  getProduct(id: "PRODUCT_ID_HERE") {
    id
    name
    description
    longDescription
    mrp
    sellingPrice
    discountPercentage
    stockQuantity
    isAvailable
    lowStockThreshold
    unit
    unitValue
    packSize
    brand
    isVeg
    expiryDays
    images
    createdAt
    updatedAt
    shop {
      id
      name
    }
    category {
      id
      name
    }
    subCategory {
      id
      name
    }
  }
}
```

### 34) Search Products

**Requires Permission:** `READ_PRODUCT`
**Description:** Search products using Elasticsearch with fuzzy matching across name, description, category, subcategory, and shop.

```graphql
query SearchProducts {
  searchProducts(query: "iPhone") {
    id
    name
    description
    mrp
    sellingPrice
    category
    subCategory
    shop
    isAvailable
    stockQuantity
    score
  }
}
```

**Note:** This uses Elasticsearch for fast, fuzzy search across multiple product fields. Returns results with relevance score. The category, subCategory, and shop fields return string values (names) rather than full objects.

### 35) Sync Products to Elasticsearch

**Requires Permission:** `CREATE_PRODUCT`
**Description:** Sync all existing products from database to Elasticsearch (Admin only).

```graphql
mutation SyncProducts {
  syncProductsToElasticsearch {
    indexed
  }
}
```

**Note:**

- This mutation manually triggers a sync of all products to Elasticsearch.
- An **automatic cron job** runs every 1 hour to sync products to Elasticsearch automatically.
- Run this mutation after initial setup or when Elasticsearch data needs to be refreshed immediately.

### 34) Update Product

**Requires Permission:** `UPDATE_PRODUCT`

```graphql
mutation UpdateProduct {
  updateProduct(
    input: {
      id: "PRODUCT_ID_HERE"
      name: "iPhone 15 Pro Max"
      sellingPrice: 94999
      stockQuantity: 30
      isAvailable: true
    }
  ) {
    id
    name
    description
    mrp
    sellingPrice
    stockQuantity
    isAvailable
    updatedAt
  }
}
```

### 35) Delete Product

**Requires Permission:** `DELETE_PRODUCT`

```graphql
mutation DeleteProduct {
  deleteProduct(id: "PRODUCT_ID_HERE")
}
```

## Media Management APIs

### 36) Upload Media

**Requires Authentication:** Yes (JWT Token Required)

**Note:** This API accepts a local file path and uploads it to Cloudinary. The service will validate the file, check size and format before uploading.

**Simple Upload Example:**

```graphql
mutation {
  uploadMedia(filePath: "/home/user/downloads/image.jpg") {
    url
    publicId
    type
    originalName
    size
    format
    sourceUrl
  }
}
```

**With Variables:**

```graphql
mutation UploadMedia($filePath: String!) {
  uploadMedia(filePath: $filePath) {
    url
    publicId
    type
    originalName
    size
    format
    sourceUrl
  }
}
```

Variables:

```json
{
  "filePath": "/home/user/downloads/image.jpg"
}
```

**Your Example:**

```graphql
mutation {
  uploadMedia(filePath: "/home/wappnet-95/Downloads/download (1).jpeg") {
    url
    publicId
    type
    originalName
    size
    format
    sourceUrl
  }
}
```

**Supported File Types:**

- Images: jpg, jpeg, png, gif, webp, svg (Max: 5MB)
- Videos: mp4, avi, mov, wmv, flv, webm (Max: 100MB)
- PDF files (Max: 10MB)

### 37) Delete Media

**Simple Delete Example:**

```graphql
mutation {
  deleteFile(
    url: "https://res.cloudinary.com/your-cloud-name/image/upload/v1/media/abc123.jpg"
  )
}
```

## Cart Management APIs

### 38) Get Cart

**Requires Authentication:** Yes (JWT Token Required)
**Requires Permission:** `CART`

```graphql
query GetCart {
  getCart {
    id
    totalAmount
    totalItems
    isActive
    user {
      id
      firstName
      lastName
      email
    }
    items {
      id
      quantity
      price
      totalPrice
      productId
    }
  }
}
```

### 39) Add Item to Cart

**Requires Authentication:** Yes (JWT Token Required)
**Requires Permission:** `CART`

```graphql
mutation AddToCart {
  addToCart(
    input: { productId: "PRODUCT_ID_HERE", quantity: 2, price: 999.99 }
  ) {
    id
    totalAmount
    totalItems
    isActive
    items {
      id
      quantity
      price
      totalPrice
      productId
    }
  }
}
```

### 40) Update Cart Item

**Requires Authentication:** Yes (JWT Token Required)
**Requires Permission:** `CART`

```graphql
mutation UpdateCartItem {
  updateCartItem(productId: "PRODUCT_ID_HERE", quantity: 3) {
    id
    totalAmount
    totalItems
    isActive
    items {
      id
      quantity
      price
      totalPrice
      productId
    }
  }
}
```

### 41) Remove Cart Item

**Requires Authentication:** Yes (JWT Token Required)
**Requires Permission:** `CART`

```graphql
mutation RemoveCartItem {
  removeCartItem(itemId: 1) {
    id
    totalAmount
    totalItems
    isActive
    items {
      id
      quantity
      price
      totalPrice
      productId
    }
  }
}
```

### 42) Clear Cart

**Requires Authentication:** Yes (JWT Token Required)
**Requires Permission:** `CART`

```graphql
mutation ClearCart {
  clearCart
}
```

## Order Management APIs

### 43) Create Order

**Requires Authentication:** Yes (JWT Token Required)

```graphql
mutation CreateOrder {
  createOrder(
    input: {
      addressLine1: "123 Main Street"
      addressLine2: "Apt 4B"
      city: "New York"
      state: "NY"
      country: "USA"
      pincode: "10001"
      latitude: 40.7128
      longitude: -74.0060
      paymentMethod: CASH
      couponCode: "SAVE10"
    }
  ) {
    id
    totalAmount
    deliveryCharge
    totalItems
    status
    paymentMethod
    paymentStatus
    latitude
    longitude
    couponId
    discountAmount
    user {
      id
      firstName
      lastName
      email
    }
    items {
      id
      quantity
      price
      totalPrice
      productId
    }
  }
}
```

### 44) Get All Orders (Admin Only)

**Requires Authentication:** Yes (JWT Token Required)
**Requires Role:** `admin`

```graphql
query GetAllOrders {
  getOrders {
    id
    totalAmount
    deliveryCharge
    totalItems
    status
    paymentMethod
    paymentStatus
    couponId
    discountAmount
    user {
      id
      firstName
      lastName
      email
    }
    items {
      id
      quantity
      price
      totalPrice
      productId
    }
  }
}
```

### 45) Get My Orders

**Requires Authentication:** Yes (JWT Token Required)

```graphql
query GetMyOrders {
  getMyOrders {
    id
    totalAmount
    deliveryCharge
    totalItems
    status
    paymentMethod
    paymentStatus
    couponId
    discountAmount
    items {
      id
      quantity
      price
      totalPrice
      productId
    }
  }
}
```

### 46) Get Order By ID

**Requires Authentication:** Yes (JWT Token Required)

```graphql
query GetOrder {
  getOrder(id: "ORDER_ID_HERE") {
    id
    totalAmount
    deliveryCharge
    totalItems
    status
    paymentMethod
    paymentStatus
    couponId
    discountAmount
    user {
      id
      firstName
      lastName
      email
    }
    items {
      id
      quantity
      price
      totalPrice
      productId
    }
  }
}
```

### 47) Get Seller Orders

**Requires Authentication:** Yes (JWT Token Required)
**Requires Role:** `seller`

```graphql
query GetSellerOrders {
  getSellerOrders {
    id
    totalAmount
    deliveryCharge
    totalItems
    status
    paymentMethod
    paymentStatus
    user {
      id
      firstName
      lastName
      email
    }
    items {
      id
      quantity
      price
      totalPrice
      productId
    }
  }
}
```

### 48) Update Order Status

**Requires Authentication:** Yes (JWT Token Required)

```graphql
mutation UpdateOrderStatus {
  updateOrderStatus(input: { orderId: "ORDER_ID_HERE", status: "CONFIRMED" }) {
    id
    totalAmount
    deliveryCharge
    totalItems
    status
    paymentMethod
    paymentStatus
    user {
      id
      firstName
      lastName
      email
    }
    items {
      id
      quantity
      price
      totalPrice
      productId
    }
  }
}
```

### 49) Update Order

**Requires Authentication:** Yes (JWT Token Required)

```graphql
mutation UpdateOrder {
  updateOrder(
    id: "ORDER_ID_HERE"
    data: {
      addressLine1: "456 Updated Street"
      addressLine2: "Suite 100"
      city: "Los Angeles"
      state: "CA"
      country: "USA"
      pincode: "90001"
    }
  ) {
    id
    totalAmount
    deliveryCharge
    totalItems
    status
    paymentMethod
    paymentStatus
    user {
      id
      firstName
      lastName
      email
    }
    items {
      id
      quantity
      price
      totalPrice
      productId
    }
  }
}
```

### 50) Download Order PDF

**Requires Authentication:** Yes (JWT Token Required)

```graphql
query DownloadOrderPdf {
  downloadOrderPdf(orderId: "ORDER_ID_HERE")
}
```

### Step 1: Add items to cart

```graphql
mutation AddToCart {
  addToCart(input: { productId: "PRODUCT_ID_1", quantity: 2, price: 999.99 }) {
    id
    totalAmount
    totalItems
    items {
      productId
      quantity
      price
      totalPrice
    }
  }
}
```

### Step 2: View cart

```graphql
query GetCart {
  getCart {
    id
    totalAmount
    totalItems
    items {
      productId
      quantity
      price
      totalPrice
    }
  }
}
```

### Step 3: Create order

```graphql
mutation CreateOrder {
  createOrder(
    input: {
      addressLine1: "123 Main Street"
      city: "New York"
      state: "NY"
      country: "USA"
      pincode: "10001"
      paymentMethod: CASH_ON_DELIVERY
      couponCode: "SAVE10"
    }
  ) {
    id
    totalAmount
    totalItems
    status
    paymentMethod
    paymentStatus
    couponId
    discountAmount
  }
}
```

### Step 4: View my orders

```graphql
query GetMyOrders {
  getMyOrders {
    id
    totalAmount
    totalItems
    status
    paymentMethod
    paymentStatus
  }
}
```

### Step 5: Update order status (if admin)

```graphql
mutation UpdateOrderStatus {
  updateOrderStatus(input: { orderId: "ORDER_ID_HERE", status: 2 }) {
    id
    status
    paymentStatus
  }
}
```

## Delivery Profile API

### 50) Create Delivery Profile

**Mutation:**

```graphql
mutation CreateDeliveryProfile {
  createDeliveryProfile(
    input: {
      vehicleType: "BIKE"
      vehicleName: "Honda Shine"
      rcBookPhoto: "https://example.com/rc-book.jpg"
      licensePhoto: "https://example.com/license.jpg"
      addressLine1: "123 Main Street"
      addressLine2: "Apt 4B"
      city: "Mumbai"
      state: "Maharashtra"
      pincode: "400001"
      location: "Bandra West"
      latitude: 19.0760
      longitude: 72.8777
    }
  ) {
    id
    vehicleType
    vehicleName
    rcBookPhoto
    licensePhoto
    addressLine1
    addressLine2
    city
    state
    pincode
    location
    latitude
    longitude
    isAvailable
    user {
      id
      firstName
      lastName
      email
    }
  }
}
```

### 51) Get All Delivery Profiles

**Query:**

```graphql
query GetDeliveryProfiles {
  getDeliveryProfiles {
    id
    vehicleType
    vehicleName
    rcBookPhoto
    licensePhoto
    addressLine1
    addressLine2
    city
    state
    pincode
    location
    latitude
    longitude
    isAvailable
    user {
      id
      firstName
      lastName
      email
    }
  }
}
```

### 52) Get Delivery Profile by ID

**Query:**

```graphql
query GetDeliveryProfile {
  getDeliveryProfile(id: "PROFILE_ID_HERE") {
    id
    vehicleType
    vehicleName
    rcBookPhoto
    licensePhoto
    addressLine1
    addressLine2
    city
    state
    pincode
    location
    latitude
    longitude
    isAvailable
    user {
      id
      firstName
      lastName
      email
    }
  }
}
```

### 53) Update Delivery Profile

**Mutation:**

```graphql
mutation UpdateDeliveryProfile {
  updateDeliveryProfile(
    input: {
      id: "PROFILE_ID_HERE"
      vehicleType: "SCOOTER"
      vehicleName: "Honda Activa"
      rcBookPhoto: "https://example.com/new-rc-book.jpg"
      licensePhoto: "https://example.com/new-license.jpg"
      addressLine1: "456 New Street"
      addressLine2: "Building 2"
      city: "Pune"
      state: "Maharashtra"
      pincode: "411001"
      location: "Koregaon Park"
      latitude: 18.5204
      longitude: 73.8567
      isAvailable: true
    }
  ) {
    id
    vehicleType
    vehicleName
    rcBookPhoto
    licensePhoto
    addressLine1
    addressLine2
    city
    state
    pincode
    location
    latitude
    longitude
    isAvailable
    user {
      id
      firstName
      lastName
      email
    }
  }
}
```

## Complete Delivery Profile Flow Example

Here's a complete example of the delivery profile management flow:

### Step 1: Create a delivery profile

```graphql
mutation CreateDeliveryProfile {
  createDeliveryProfile(
    input: {
       : "BIKE"
      vehicleName: "Honda Shine"
      rcBookPhoto: "https://example.com/rc-book.jpg"
      licensePhoto: "https://example.com/license.jpg"
      addressLine1: "123 Main Street"
      city: "Mumbai"
      state: "Maharashtra"
      pincode: "400001"
      latitude: 19.0760
      longitude: 72.8777
    }
  ) {
    id
    vehicleType
    vehicleName
    isAvailable
  }
}
```

### Step 2: View all delivery profiles

```graphql
query GetDeliveryProfiles {
  getDeliveryProfiles {
    id
    vehicleType
    vehicleName
    city
    state
    isAvailable
  }
}
```

### Step 3: Update availability status

```graphql
mutation UpdateDeliveryProfile {
  updateDeliveryProfile(input: { id: "PROFILE_ID_HERE", isAvailable: false }) {
    id
    vehicleType
    isAvailable
  }
}
```

## Delivery Assignment API

### 54) Accept Delivery Assignment

**Mutation:**

```graphql
mutation AcceptDelivery {
  acceptDelivery(input: { assignmentId: "ASSIGNMENT_ID_HERE" }) {
    id
    status
    distance
    assignedAt
    respondedAt
    order {
      id
      totalAmount
      status
      deliveryPersonId
    }
    deliveryProfile {
      id
      vehicleType
      vehicleName
      isAvailable
    }
  }
}
```

### 55) Reject Delivery Assignment

**Mutation:**

```graphql
mutation RejectDelivery {
  rejectDelivery(
    input: { assignmentId: "ASSIGNMENT_ID_HERE", reason: "Not available" }
  ) {
    id
    status
    distance
    assignedAt
    respondedAt
    order {
      id
      totalAmount
      status
    }
    deliveryProfile {
      id
      vehicleType
      vehicleName
    }
  }
}
```

### 56) Get My Delivery Assignments

**Query:**

```graphql
query GetMyAssignments {
  getMyAssignments {
    id
    status
    distance
    assignedAt
    expiresAt
    respondedAt
    retryCount
    order {
      id
      totalAmount
      totalItems
      status
      addressLine1
      city
      state
      pincode
      latitude
      longitude
    }
    deliveryProfile {
      id
      vehicleType
      vehicleName
    }
  }
}
```

### 57) Get Pending Assignment for Order.

**Query:**

```graphql
query GetPendingAssignment {
  getPendingAssignment(orderId: "ORDER_ID_HERE") {
    id
    status
    distance
    assignedAt
    expiresAt
    order {
      id
      totalAmount
      status
      addressLine1
      city
      state
    }
    deliveryProfile {
      id
      vehicleType
      vehicleName
    }
  }
}
```

## Complete Delivery Assignment Flow Example

Here's a complete example of the delivery assignment flow:

### Step 1: Order is automatically assigned to nearest delivery person

When an order is created, the system automatically assigns it to the nearest available delivery person based on latitude and longitude.

### Step 2: Delivery person views their assignments

```graphql
query GetMyAssignments {
  getMyAssignments {
    id
    status
    distance
    expiresAt
    order {
      id
      totalAmount
      addressLine1
      city
      latitude
      longitude
    }
  }
}
```

### Step 3: Delivery person accepts the assignment

```graphql
mutation AcceptDelivery {
  acceptDelivery(input: { assignmentId: "ASSIGNMENT_ID_HERE" }) {
    id
    status
    order {
      id
      deliveryPersonId
    }
  }
}
```

### Step 4: If not accepted within 2 minutes, assignment expires and reassigns

The system automatically checks every 30 seconds for expired assignments and reassigns them to the next nearest available delivery person.

### Step 5: Delivery person can reject assignment

```graphql
mutation RejectDelivery {
  rejectDelivery(
    input: { assignmentId: "ASSIGNMENT_ID_HERE", reason: "Too far" }
  ) {
    id
    status
    order {
      id
    }
  }
}
```

## Review/Rating System APIs

### 58) Create Product Review

**Requires Authentication:** Yes (JWT Token Required)
**Permission Required:** CREATE_REVIEW
**Note:** Only users who have purchased the product can leave a review.

```graphql
mutation CreateProductReview {
  createProductReview(
    input: {
      rating: 5
      comment: "Great product! Highly recommended."
      media: "https://example.com/review-image.jpg"
      productId: "PRODUCT_ID_HERE"
      orderId: "ORDER_ID_HERE"
    }
  ) {
    id
    rating
    comment
    media
    user {
      id
      firstName
      lastName
    }
    product {
      id
      name
    }
    order {
      id
      totalAmount
    }
    createdAt
    updatedAt
  }
}
```

**Validation:**

- Rating must be between 1 and 5 (decimal values allowed, e.g., 2.5, 3.7)
- User must have purchased the product in the specified order
- User can only review each product once per order

### 59) Create Seller Review

**Requires Authentication:** Yes (JWT Token Required)
**Permission Required:** CREATE_REVIEW
**Note:** Only users who have purchased from the seller can leave a review.

```graphql
mutation CreateSellerReview {
  createSellerReview(
    input: {
      rating: 4
      comment: "Good delivery and packaging."
      shopId: "SHOP_ID_HERE"
      orderId: "ORDER_ID_HERE"
    }
  ) {
    id
    rating
    comment
    user {
      id
      firstName
      lastName
    }
    shop {
      id
      shopName
    }
    order {
      id
      totalAmount
    }
    createdAt
    updatedAt
  }
}
```

**Validation:**

- Rating must be between 1 and 5 (decimal values allowed, e.g., 2.5, 3.7)
- User must have placed the specified order
- User can only review each seller once per order

### 60) Get Product Reviews

**Requires Authentication:** Yes (JWT Token Required)
**Permission Required:** READ_REVIEW

```graphql
query GetProductReviews {
  getProductReviews(productId: "PRODUCT_ID_HERE") {
    id
    rating
    comment
    user {
      id
      firstName
      lastName
    }
    product {
      id
      name
    }
    order {
      id
    }
    createdAt
    updatedAt
  }
}
```

### 61) Get Product Average Rating

**Requires Authentication:** Yes (JWT Token Required)
**Permission Required:** READ_REVIEW

```graphql
query GetProductAverageRating {
  getProductAverageRating(productId: "PRODUCT_ID_HERE")
}
```

**Response:** Returns a number representing the average rating (0 if no reviews exist).

### 62) Get Seller Reviews

**Requires Authentication:** Yes (JWT Token Required)
**Permission Required:** READ_REVIEW

```graphql
query GetSellerReviews {
  getSellerReviews(shopId: "SHOP_ID_HERE") {
    id
    rating
    comment
    user {
      id
      firstName
      lastName
    }
    shop {
      id
      name
    }
    order {
      id
    }
    createdAt
    updatedAt
  }
}
```

### 63) Get Seller Average Rating

**Requires Authentication:** Yes (JWT Token Required)
**Permission Required:** READ_REVIEW

```graphql
query GetSellerAverageRating {
  getSellerAverageRating(shopId: "SHOP_ID_HERE")
}
```

**Response:** Returns a number representing the average rating (0 if no reviews exist).

### 64) Get My Product Reviews

**Requires Authentication:** Yes (JWT Token Required)
**Permission Required:** READ_REVIEW

```graphql
query GetMyProductReviews {
  getMyProductReviews {
    id
    rating
    comment
    product {
      id
      name
    }
    order {
      id
      totalAmount
      createdAt
    }
    createdAt
    updatedAt
  }
}
```

### 65) Get My Seller Reviews

**Requires Authentication:** Yes (JWT Token Required)
**Permission Required:** READ_REVIEW

```graphql
query GetMySellerReviews {
  getMySellerReviews {
    id
    rating
    comment
    shop {
      id
      shopName
    }
    order {
      id
      totalAmount
      createdAt
    }
    createdAt
    updatedAt
  }
}
```

### 66) Get All Product Reviews (Admin)

**Requires Authentication:** Yes (JWT Token Required)
**Permission Required:** READ_REVIEW
**Role Required:** Admin

```graphql
query GetAllProductReviews {
  getAllProductReviews {
    id
    rating
    comment
    media
    user {
      id
      firstName
      lastName
      email
    }
    product {
      id
      name
    }
    order {
      id
      totalAmount
      createdAt
    }
    createdAt
    updatedAt
  }
}
```

### 67) Get All Seller Reviews (Admin)

**Requires Authentication:** Yes (JWT Token Required)
**Permission Required:** READ_REVIEW
**Role Required:** Admin

```graphql
query GetAllSellerReviews {
  getAllSellerReviews {
    id
    rating
    comment
    user {
      id
      firstName
      lastName
      email
    }
    shop {
      id
      name
    }
    order {
      id
      totalAmount
      createdAt
    }
    createdAt
    updatedAt
  }
}
```

### 68) Update Product Review

**Requires Authentication:** Yes (JWT Token Required)
**Permission Required:** UPDATE_REVIEW
**Note:** Only the customer who created the review can update it.

```graphql
mutation UpdateProductReview {
  updateProductReview(
    input: {
      id: "REVIEW_ID_HERE"
      rating: 4
      comment: "Updated review after using the product more."
      media: "https://example.com/new-review-image.jpg"
    }
  ) {
    id
    rating
    comment
    media
    user {
      id
      firstName
      lastName
    }
    product {
      id
      name
    }
    order {
      id
    }
    createdAt
    updatedAt
  }
}
```

### 69) Update Seller Review

```graphql
mutation UpdateSellerReview {
  updateSellerReview(
    input: {
      id: ""
      rating: 5
      comment: "Updated review after another purchase."
    }
  ) {
    id
    rating
    comment
    user {
      id
      firstName
      lastName
    }
    shop {
      id
      shopName
    }
    order {
      id
    }
    createdAt
    updatedAt
  }
}
```

### 70) Delete Product Review

```graphql
mutation DeleteProductReview {
  deleteProductReview(id: "REVIEW_ID_HERE")
}
```

### 71) Delete Seller Review

```graphql
mutation DeleteSellerReview {
  deleteSellerReview(id: "REVIEW_ID_HERE")
}
```

**Validation:**

- Only the reviewer who created the review can delete it

### 72) Admin Delete Product Review


```graphql
mutation AdminDeleteProductReview {
  adminDeleteProductReview(id: "REVIEW_ID_HERE")
}
```


### 73) Admin Delete Seller Review

```graphql
mutation AdminDeleteSellerReview {
  adminDeleteSellerReview(id: "REVIEW_ID_HERE")
}
```

