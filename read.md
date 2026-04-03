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

**Status Codes:**

- `200` - Success
- `201` - Created successfully
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

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
      roleId: 1
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

**Note:** `roleId` in `RegisterInput` is a `String`. If not provided, `role` will be `null` in the response.
**Note:** Register now generates an OTP (`REGISTER` type), stores it in `otps`, and sends it by email. New users are created with `isVerified: false`.

**Sample Response:**

```json
{
  "data": {
    "register": {
      "id": "USER_UUID",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "mobile": "9876543210",
      "isVerified": false,
      "adminApproved": false,
      "createdAt": "2026-04-03T12:34:56.000Z",
      "role": null
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

**Sample Response:**

```json
{
  "data": {
    "login": {
      "statusCode": 200,
      "message": "Login successful",
      "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
          "id": "30e1d087-1598-43c4-83d0-34fd19b5e5f8",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "mobile": "9876543210",
          "isVerified": true,
          "adminApproved": true,
          "role": {
            "id": "abc123-def456-ghi789",
            "name": "admin",
            "permissions": [
              { "id": "perm-1", "name": "CREATE_USER" },
              { "id": "perm-2", "name": "READ_USER" }
            ]
          }
        }
      }
    }
  }
}
```

**If email is not verified, login response:**

```json
{
  "errors": [
    {
      "message": "Please verify your email first"
    }
  ],
  "data": null
}
```

## User Management APIs

### 3) Get All User Profiles (Admin Only)

**Requires Permission:** `READ_USER` (Admin functionality)

```graphql
query GetAllUserProfiles {
  getAllUserProfiles {
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

**Sample Response:**

```json
{
  "data": {
    "getAllUserProfiles": {
      "statusCode": 200,
      "message": "Users retrieved successfully",
      "data": [
        {
          "id": "30e1d087-1598-43c4-83d0-34fd19b5e5f8",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "mobile": "9876543210",
          "isVerified": true,
          "adminApproved": true,
          "createdAt": "2026-04-03T09:04:38.138Z",
          "role": {
            "id": "abc123-def456-ghi789"
          }
        }
      ]
    }
  }
}
```

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

**Sample Response:**

```json
{
  "data": {
    "getUserById": {
      "statusCode": 200,
      "message": "User retrieved successfully",
      "data": {
        "id": "30e1d087-1598-43c4-83d0-34fd19b5e5f8",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "mobile": "9876543210",
        "isVerified": true,
        "adminApproved": true,
        "createdAt": "2026-04-03T09:04:38.138Z",
        "role": {
          "id": "abc123-def456-ghi789",
          "name": "admin"
        }
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

**Sample Response:**

```json
{
  "data": {
    "deleteUser": {
      "statusCode": 200,
      "message": "User deleted successfully",
      "data": true
    }
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

**Sample Response:**

```json
{
  "data": {
    "approveUser": {
      "statusCode": 200,
      "message": "User approved successfully",
      "data": {
        "id": "30e1d087-1598-43c4-83d0-34fd19b5e5f8",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "mobile": "9876543210",
        "isVerified": true,
        "adminApproved": true,
        "createdAt": "2026-04-03T09:04:38.138Z",
        "role": {
          "id": "abc123-def456-ghi789",
          "name": "admin"
        }
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

## Role Management APIs

### 7) Create Role

**Requires Permission:** `CREATE_USER` (Admin functionality)

mutation CreateRole {
createRole(name: "admin") {
id
name
}
}

````

### 8) Get All Roles

**Requires Permission:** `READ_USER`

```graphql
query GetRoles {
  getRoles {
    id
    name
    permissions {
      id
      name
    }
  }
}
````

### 9) Get Role By Id

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

### 10) Update Role

**Requires Permission:** `UPDATE_USER`

```graphql
mutation UpdateRole {
  updateRole(id: "ROLE_ID_HERE", name: "super_admin") {
    id
    name
  }
}
```

### 11) Delete Role

**Requires Permission:** `DELETE_USER`

```graphql
mutation DeleteRole {
  deleteRole(id: "ROLE_ID_HERE")
}
```

## Permission Management APIs

### 12) Create Permission

**Requires Permission:** `CREATE_USER` (Admin functionality)

```graphql
mutation CreatePermission {
  createPermission(name: "CUSTOM_PERMISSION") {
    id
    name
  }
}
```

### 13) Get All Permissions

**Requires Permission:** `READ_USER`

```graphql
query GetPermissions {
  findAll {
    id
    name
  }
}
```

### 14) Assign Permission to Role

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

### 15) Remove Permission from Role

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
```

### 16) Get Permissions by Role

**Requires Permission:** `READ_USER`

```graphql
query GetPermissionsByRole {
  getPermissionByRole(roleId: "ROLE_ID_HERE") {
    id
    name
  }
}
```

## Usage Notes:

### Authentication

- All protected APIs require `Authorization: Bearer <ACCESS_TOKEN>` header
- Token is obtained from the login mutation
- Tokens expire and need to be refreshed

### Permissions

- Each API endpoint requires specific permissions as mentioned above
- Users inherit permissions from their assigned roles
- Multiple roles can be assigned to a user for combined permissions

### Error Handling

- Unauthorized requests will return authentication errors
- Insufficient permissions will return authorization errors
- Validation errors will include detailed field information

### Data Validation

- Email format is validated
- Password must meet security requirements
- Mobile number format is validated
- Role and Permission IDs must be valid UUIDs
