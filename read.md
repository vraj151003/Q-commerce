# GraphQL API Payload Guide

GraphQL endpoint:
- `http://localhost:5000/graphql`

For protected APIs (`getCurrentUserProfile`, `updateUserProfile`), send header:
- `Authorization: Bearer <ACCESS_TOKEN>`

## 1) Register
```graphql
mutation Register {
  register(
    input: {
      firstName: "John"
      lastName: "Doe"
      email: "john@example.com"
      password: "Pass@123"
      mobile: "9876543210"
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
    roleId
  }
}
```

## 2) Login
```graphql
mutation Login {
  login(input: { email: "john@example.com", password: "Pass@123" }) {
    accessToken
    user {
      id
      firstName
      lastName
      email
    }
  }
}
```

## 3) Get All User Profiles
```graphql
query GetAllUserProfiles {
  getAllUserProfiles {
    id
    firstName
    lastName
    email
    mobile
    isVerified
    adminApproved
    createdAt
    roleId
  }
}
```

## 4) Get User Profile By Id
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
    roleId
  }
}
```

## 5) Get Current User Profile (Protected)
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
    roleId
  }
}
```

## 6) Update User Profile (Protected, Email Cannot Be Updated)
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
    roleId
  }
}
```

Notes:
- `email` is intentionally not allowed in `UpdateUserProfileInput`.
- You can keep only fields you want to update in the `input` object.
