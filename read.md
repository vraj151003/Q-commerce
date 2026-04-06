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
    id
    name
  }
}
```
````
