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

## Role Management APIs

### 11) Create Role

**Requires Permission:** `CREATE_USER` (Admin functionality)

mutation CreateRole {
createRole(name: "admin") {
id
name
}
}

````

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
    id
    name
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
    id
    name
  }
}
```

### 17) Get All Permissions

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
    id
    name
  }
}
```

### 19) Assign Permission to Role

**Requires Permission:** `UPDATE_USER`

```graphql
mutation AssignPermission {
  assignPermission(roleId: "ROLE_ID_HERE", permissionId: "PERMISSION_ID_HERE") {
    id
    name
    permissions {
      id
      name
    }
  }
}
```

### 20) Remove Permission from Role

**Requires Permission:** `UPDATE_USER`

```graphql
mutation RemovePermission {
  removePermission(roleId: "ROLE_ID_HERE", permissionId: "PERMISSION_ID_HERE") {
    id
    name
    permissions {
      id
      name
    }
}
  }
}
```

## Category Management APIs

### 21) Create Category

**Requires Permission:** `CREATE_CATEGORY`

```graphql
mutation CreateCategory {
  createCategory(
    input: {
      name: "Electronics"
      description: "Electronic items and gadgets"
    }
  ) {
    id
    name
    description
    createdAt
    updatedAt
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
    createdAt
    updatedAt
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
    createdAt
    updatedAt
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
    createdAt
    updatedAt
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
    input: {
      name: "Mobile Phones"
      categoryId: "CATEGORY_ID_HERE"
    }
  ) {
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
  updateSubCategory(
    input: {
      id: "SUBCATEGORY_ID_HERE"
      name: "Smartphones"
    }
  ) {
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
  deleteFile(url: "https://res.cloudinary.com/your-cloud-name/image/upload/v1/media/abc123.jpg")
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
    input: {
      productId: "PRODUCT_ID_HERE"
      quantity: 2
      price: 999.99
    }
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

**With Variables:**
```graphql
mutation AddToCart($input: AddToCartInput!) {
  addToCart(input: $input) {
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

Variables:
```json
{
  "input": {
    "productId": "PRODUCT_ID_HERE",
    "quantity": 2,
    "price": 999.99
  }
}
```

### 40) Update Cart Item

**Requires Authentication:** Yes (JWT Token Required)
**Requires Permission:** `CART`

```graphql
mutation UpdateCartItem {
  updateCartItem(
    productId: "PRODUCT_ID_HERE"
    quantity: 3
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

**With Variables:**
```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
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

Variables:
```json
{
  "input": {
    "addressLine1": "123 Main Street",
    "addressLine2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "pincode": "10001"
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
  updateOrderStatus(
    input: {
      orderId: "ORDER_ID_HERE"
      status: "CONFIRMED"
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

**Available Order Status Values:**
- `PENDING`
- `CONFIRMED`
- `PACKED`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `ASSIGNED`
- `CANCELLED`

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

**Response:** Returns a base64 encoded string of the PDF file.

## Payment Methods

The following payment methods are available:

- `CASH_ON_DELIVERY` (Value: 1)
- `ONLINE_PAYMENT` (Value: 2)

## Payment Status

The following payment statuses are available:

- `PENDING` (Value: 1)
- `PROCESSING` (Value: 2)
- `COMPLETED` (Value: 3)
- `FAILED` (Value: 4)
- `REFUNDED` (Value: 5)

## Complete Order Flow Example

Here's a complete example of the order flow from cart to order:

### Step 1: Add items to cart
```graphql
mutation AddToCart {
  addToCart(
    input: {
      productId: "PRODUCT_ID_1"
      quantity: 2
      price: 999.99
    }
  ) {
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
    }
  ) {
    id
    totalAmount
    totalItems
    status
    paymentMethod
    paymentStatus
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
  updateOrderStatus(
    input: {
      orderId: "ORDER_ID_HERE"
      status: "CONFIRMED"
    }
  ) {
    id
    status
    paymentStatus
  }
}
```
